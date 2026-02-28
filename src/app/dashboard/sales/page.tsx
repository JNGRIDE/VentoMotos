"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { Edit, LoaderCircle, AlertTriangle, CheckCircle, ShieldAlert, Trash2, UserPlus, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EditSaleDialog } from "@/components/sales/edit-sale-dialog";
import { useFirestore } from "@/firebase";
import { getAllSales, updateSale, batchUpdateSales, getUserProfiles, getUserProfile, deleteSale } from "@/firebase/services";
import { useUser } from "@/firebase/auth/use-user";
import type { Sale, NewSale, UserProfile } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";

export default function SalesPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [sales, setSales] = useState<Sale[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [salespersonFilter, setSalespersonFilter] = useState<string>("all");

  // Edit Dialog State
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Delete State
  const [deletingSale, setDeletingSale] = useState<Sale | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // VAT Fix State
  const [vatFixDialogOpen, setVatFixDialogOpen] = useState(false);
  const [vatFixCandidates, setVatFixCandidates] = useState<Sale[]>([]);
  const [isFixingVat, setIsFixingVat] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
        const profile = await getUserProfile(db, user.uid);
        setCurrentUserProfile(profile);

        if (profile?.role === 'Manager') {
            const [fetchedSales, fetchedProfiles] = await Promise.all([
              getAllSales(db),
              getUserProfiles(db)
            ]);
            setSales(fetchedSales);
            setUserProfiles(fetchedProfiles);
        }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
          title: "Error",
          description: "Failed to load sales data.",
          variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [db, user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredSales = useMemo(() => {
    if (salespersonFilter === "all") return sales;
    return sales.filter(s => s.salespersonId === salespersonFilter);
  }, [sales, salespersonFilter]);

  const handleEditClick = (sale: Sale) => {
    setEditingSale(sale);
    setEditDialogOpen(true);
  };

  const handleUpdateSale = async (saleId: string, oldSale: Sale, newSale: NewSale) => {
      await updateSale(db, saleId, oldSale, newSale);
      await fetchData(); // Refresh list
  };

  const handleDeleteSale = async () => {
    if (!deletingSale) return;
    setIsDeleting(true);
    try {
      await deleteSale(db, deletingSale);
      toast({
        title: "Venta Eliminada",
        description: `La venta de ${deletingSale.prospectName} ha sido borrada y el stock restaurado.`,
      });
      setDeletingSale(null);
      await fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la venta.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const checkVatFixCandidates = () => {
      // Find sales with integer amounts > 0
      const candidates = sales.filter(s => s.amount > 0 && Number.isInteger(s.amount));
      setVatFixCandidates(candidates);
      setVatFixDialogOpen(true);
  }

  const applyVatFix = async () => {
      if (vatFixCandidates.length === 0) return;
      setIsFixingVat(true);
      try {
          const updates = vatFixCandidates.map(sale => ({
              id: sale.id,
              amount: sale.amount / 1.16
          }));
          await batchUpdateSales(db, updates);
          toast({
              title: "Success",
              description: `Updated ${updates.length} sales to Net Amount.`,
          });
          setVatFixDialogOpen(false);
          fetchData();
      } catch (error) {
          console.error("VAT Fix Error:", error);
          toast({
            title: "Error",
            description: "Failed to update sales.",
            variant: "destructive"
          });
      } finally {
          setIsFixingVat(false);
      }
  }

  const getSalespersonName = (uid: string) => {
      const profile = userProfiles.find(p => p.uid === uid);
      return profile ? profile.name : "Unknown";
  }

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center min-h-[400px]">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (currentUserProfile?.role !== 'Manager') {
    return (
       <div className="flex flex-col items-center justify-center h-[calc(100vh-theme(spacing.32))]">
          <ShieldAlert className="h-10 w-10 text-destructive" />
          <h2 className="mt-4 text-xl font-semibold">Access Denied</h2>
          <p className="text-muted-foreground mt-2">Only managers can access this page.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Control de Ventas</h1>
          <p className="text-muted-foreground">Historial completo y gestión de inventario transaccional.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={checkVatFixCandidates} className="gap-2 rounded-xl h-10 border-border/40">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Fix Legacy VAT
          </Button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-muted/30 p-4 rounded-2xl border border-border/40">
        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
          <Filter className="h-4 w-4" /> Filtrar por:
        </div>
        <Select value={salespersonFilter} onValueChange={setSalespersonFilter}>
          <SelectTrigger className="w-full sm:w-[250px] bg-background rounded-xl border-border/40 h-10">
            <SelectValue placeholder="Todos los vendedores" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Todos los vendedores</SelectItem>
            {userProfiles.filter(p => p.role === 'Salesperson').map(p => (
              <SelectItem key={p.uid} value={p.uid}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto text-xs font-bold text-muted-foreground uppercase tracking-widest bg-background px-3 py-1.5 rounded-full border border-border/20 shadow-sm">
          {filteredSales.length} registros encontrados
        </div>
      </div>

      <div className="rounded-[32px] border border-border/40 bg-card shadow-soft overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/20">
            <TableRow>
              <TableHead className="font-bold">Fecha</TableHead>
              <TableHead className="font-bold">Cliente</TableHead>
              <TableHead className="font-bold">Vendedor</TableHead>
              <TableHead className="font-bold">Modelo</TableHead>
              <TableHead className="font-bold">Pago</TableHead>
              <TableHead className="text-right font-bold">Monto (Neto)</TableHead>
              <TableHead className="w-[100px] text-center font-bold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground italic">
                  No hay ventas que coincidan con los criterios.
                </TableCell>
              </TableRow>
            ) : (
              filteredSales.map((sale) => (
                <TableRow key={sale.id} className="group hover:bg-muted/10 transition-colors">
                  <TableCell className="font-medium">{format(new Date(sale.date), "dd/MM/yyyy")}</TableCell>
                  <TableCell className="font-bold">{sale.prospectName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                        {getSalespersonName(sale.salespersonId).charAt(0)}
                      </div>
                      <span className="text-sm font-medium">{getSalespersonName(sale.salespersonId)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                      <div className="font-semibold text-primary">{sale.motorcycleModel}</div>
                      {sale.soldSku && <div className="text-[10px] text-muted-foreground font-mono mt-0.5">...{sale.soldSku.slice(-8)}</div>}
                  </TableCell>
                  <TableCell>
                      <Badge variant="outline" className="rounded-lg font-bold text-[10px] uppercase border-border/60 bg-background">
                        {sale.paymentMethod === 'Financing' ? `Crédito ${sale.creditProvider || ''}` : 'Contado'}
                      </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-sm">
                      ${sale.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => handleEditClick(sale)} className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeletingSale(sale)} className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Borrar</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editingSale && (
        <EditSaleDialog
          sale={editingSale}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onUpdateSale={handleUpdateSale}
          currentUserProfile={currentUserProfile}
        />
      )}

      {/* Alerta de Eliminación */}
      <AlertDialog open={!!deletingSale} onOpenChange={(open) => !open && setDeletingSale(null)}>
        <AlertDialogContent className="rounded-[32px] border-none shadow-premium">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black">¿Eliminar registro de venta?</AlertDialogTitle>
            <AlertDialogDescription className="text-base font-medium">
              Esta acción borrará la venta de <span className="font-bold text-foreground">{deletingSale?.prospectName}</span>. 
              <br/><br/>
              Si esta venta tiene un SKU asignado, la unidad <span className="font-bold text-primary">{deletingSale?.motorcycleModel}</span> será devuelta automáticamente al inventario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="bg-secondary/40 -mx-6 -mb-6 p-6 mt-4 border-t border-border/10">
            <AlertDialogCancel className="rounded-2xl h-12 font-bold border-none bg-transparent hover:bg-background/50" disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.preventDefault(); handleDeleteSale(); }}
              className="bg-destructive text-white hover:bg-destructive/90 rounded-2xl h-12 px-8 font-black shadow-lg shadow-destructive/20"
              disabled={isDeleting}
            >
              {isDeleting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Borrado
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={vatFixDialogOpen} onOpenChange={setVatFixDialogOpen}>
          <DialogContent className="rounded-[32px]">
              <DialogHeader>
                  <DialogTitle className="text-xl font-bold">Fix Legacy VAT Amounts</DialogTitle>
                  <DialogDescription>
                      This tool identifies sales with integer amounts, which likely include 16% VAT (Gross Amount).
                      Currently, the system expects Net Amounts (Gross / 1.16).
                  </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                  {vatFixCandidates.length > 0 ? (
                      <div className="flex items-center gap-2 text-amber-600">
                          <AlertTriangle className="h-5 w-5" />
                          <span className="font-semibold">{vatFixCandidates.length} sales found with integer amounts.</span>
                      </div>
                  ) : (
                      <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-semibold">No issues found. All sales appear to have Net Amounts.</span>
                      </div>
                  )}
                  <p className="mt-2 text-sm text-muted-foreground">
                      Clicking "Apply Fix" will divide the amount of these sales by 1.16 to convert them to Net Amount.
                  </p>
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setVatFixDialogOpen(false)} className="rounded-xl">Cancel</Button>
                  <Button
                    onClick={applyVatFix}
                    disabled={vatFixCandidates.length === 0 || isFixingVat}
                    className="rounded-xl"
                  >
                      {isFixingVat && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                      Apply Fix
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
