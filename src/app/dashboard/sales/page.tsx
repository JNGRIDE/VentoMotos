"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { format, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import {
  Edit,
  LoaderCircle,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  Trash2,
  Filter,
  Search,
  ChevronRight,
  TrendingUp,
  Receipt,
  Download,
} from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EditSaleDialog } from "@/components/sales/edit-sale-dialog";
import { useFirestore } from "@/firebase";
import {
  getAllSales,
  updateSaleAndAdjustInventory,
  batchUpdateSales,
  getUserProfiles,
  getUserProfile,
  deleteSale,
} from "@/firebase/services";
import { useUser } from "@/firebase/auth/use-user";
import type { Sale, NewSale, UserProfile } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
  },
};

export default function SalesPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [sales, setSales] = useState<Sale[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(
    null
  );
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
    if (!user || !db) return;
    setLoading(true);
    try {
      const profile = await getUserProfile(db, user.uid);
      setCurrentUserProfile(profile);

      if (profile?.role === "Manager") {
        const [fetchedSales, fetchedProfiles] = await Promise.all([
          getAllSales(db),
          getUserProfiles(db),
        ]);
        setSales(fetchedSales);
        setUserProfiles(fetchedProfiles);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de ventas.",
        variant: "destructive",
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
    return sales.filter((s) => s.salespersonId === salespersonFilter);
  }, [sales, salespersonFilter]);

  const handleEditClick = (sale: Sale) => {
    setEditingSale(sale);
    setEditDialogOpen(true);
  };

  const handleUpdateSale = async (updatedData: Partial<NewSale>) => {
    if (!editingSale || !db) return;
    try {
      await updateSaleAndAdjustInventory(
        db,
        editingSale.id,
        updatedData,
        editingSale
      );
      toast({ title: "¡Actualizado!", description: "Venta e inventario sincronizados correctamente." });
      await fetchData();
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "No se pudo actualizar la venta.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSale = async () => {
    if (!deletingSale || !db) return;
    setIsDeleting(true);
    try {
      await deleteSale(db, deletingSale);
      toast({
        title: "Venta Eliminada",
        description: `Se ha borrado el registro y restaurado el stock.`,
      });
      setDeletingSale(null);
      await fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la venta.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const checkVatFixCandidates = () => {
    const candidates = sales.filter(
      (s) => s.amount > 0 && Number.isInteger(s.amount)
    );
    setVatFixCandidates(candidates);
    setVatFixDialogOpen(true);
  };

  const applyVatFix = async () => {
    if (vatFixCandidates.length === 0 || !db) return;
    setIsFixingVat(true);
    try {
      const updates = vatFixCandidates.map((sale) => ({
        id: sale.id,
        amount: sale.amount / 1.16,
      }));
      await batchUpdateSales(db, updates);
      toast({
        title: "Corrección Exitosa",
        description: `Se actualizaron ${updates.length} ventas a Monto Neto.`,
      });
      setVatFixDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("VAT Fix Error:", error);
      toast({
        title: "Error",
        description: "Error al actualizar las ventas.",
        variant: "destructive",
      });
    } finally {
      setIsFixingVat(false);
    }
  };

  const getSalespersonProfile = (uid: string) => {
    return userProfiles.find((p) => p.uid === uid);
  };

  const formatDate = (date: any) => {
    const d = new Date(date);
    return isValid(d) ? format(d, "dd MMM, yyyy", { locale: es }) : "N/A";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-theme(spacing.32))]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Sincronizando transacciones...</p>
        </motion.div>
      </div>
    );
  }

  if (currentUserProfile?.role !== "Manager") {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-theme(spacing.32))] gap-6">
        <div className="h-20 w-20 rounded-[32px] bg-destructive/10 flex items-center justify-center">
          <ShieldAlert className="h-10 w-10 text-destructive" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black">Acceso Restringido</h2>
          <p className="text-muted-foreground max-w-xs">Solo los administradores pueden gestionar el historial global de ventas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 pb-20">
      {/* Header Estilo Apple */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Receipt className="h-4 w-4 text-primary" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Operaciones Globales</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight font-headline">
            Control de Ventas
          </h1>
          <p className="text-muted-foreground text-lg">
            Auditoría y gestión completa del historial de transacciones.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-card/50 backdrop-blur-md p-2 rounded-[24px] shadow-soft border border-border/20 self-start md:self-auto">
          <div className="flex items-center pl-4 pr-2 border-r border-border/40">
            <Filter className="h-4 w-4 text-muted-foreground mr-3" />
            <Select value={salespersonFilter} onValueChange={setSalespersonFilter}>
              <SelectTrigger className="w-[180px] border-none bg-transparent h-10 rounded-2xl focus:ring-0 shadow-none font-bold">
                <SelectValue placeholder="Todos los Vendedores" />
              </SelectTrigger>
              <SelectContent className="rounded-[24px]">
                <SelectItem value="all">Todo el equipo</SelectItem>
                {userProfiles
                  .filter((p) => p.role === "Salesperson")
                  .map((p) => (
                    <SelectItem key={p.uid} value={p.uid}>
                      {p.name.split(' ')[0]}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="ghost"
            onClick={checkVatFixCandidates}
            className="h-11 rounded-2xl gap-2 hover:bg-orange-500/10 hover:text-orange-600 transition-all font-bold px-4"
          >
            <AlertTriangle className="h-4 w-4" />
            Corregir IVA
          </Button>
        </div>
      </motion.div>

      {/* Transaction List */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        <div className="bg-secondary/30 rounded-[32px] overflow-hidden border border-border/10">
          <Table>
            <TableHeader className="bg-transparent">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="h-14 pl-8 font-black text-[10px] uppercase tracking-widest text-muted-foreground/60">Fecha</TableHead>
                <TableHead className="h-14 font-black text-[10px] uppercase tracking-widest text-muted-foreground/60">Ejecutivo</TableHead>
                <TableHead className="h-14 font-black text-[10px] uppercase tracking-widest text-muted-foreground/60">Cliente</TableHead>
                <TableHead className="h-14 font-black text-[10px] uppercase tracking-widest text-muted-foreground/60">Modelo</TableHead>
                <TableHead className="h-14 font-black text-[10px] uppercase tracking-widest text-muted-foreground/60 text-center">Pago</TableHead>
                <TableHead className="h-14 pr-8 text-right font-black text-[10px] uppercase tracking-widest text-muted-foreground/60">Monto Neto</TableHead>
                <TableHead className="h-14 w-[120px] pr-8 text-center font-black text-[10px] uppercase tracking-widest text-muted-foreground/60">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-60 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 opacity-20">
                        <Search className="h-12 w-12" />
                        <p className="font-bold uppercase tracking-widest text-xs">No se encontraron ventas con este filtro</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSales.map((sale) => {
                    const spProfile = getSalespersonProfile(sale.salespersonId);
                    return (
                      <motion.tr
                        key={sale.id}
                        variants={itemVariants}
                        layout
                        className="group h-20 border-b border-border/40 hover:bg-card/60 transition-colors"
                      >
                        <TableCell className="pl-8">
                          <span className="font-bold text-foreground/90 whitespace-nowrap">{formatDate(sale.date)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 border-2 border-background shadow-sm">
                              <AvatarImage src={spProfile?.avatarUrl} />
                              <AvatarFallback className="text-[10px] font-bold">{spProfile?.name?.charAt(0) || 'E'}</AvatarFallback>
                            </Avatar>
                            <span className="font-semibold text-sm truncate max-w-[120px]">
                              {spProfile?.name?.split(' ')[0] || "Venta Externa"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">{sale.prospectName}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-secondary/50 text-muted-foreground border-none font-bold rounded-lg px-2 py-0.5">
                            {sale.motorcycleModel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={cn(
                            "rounded-lg px-2.5 py-1 font-black text-[9px] uppercase tracking-tighter border-none shadow-none",
                            sale.paymentMethod === 'Financing' 
                              ? 'bg-blue-500/10 text-blue-600' 
                              : 'bg-green-500/10 text-green-600'
                          )}>
                            {sale.paymentMethod === 'Financing' ? 'Crédito' : 'Contado'}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-8 text-right font-mono font-bold text-base text-foreground/90">
                          ${sale.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="pr-8">
                          <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditClick(sale)}
                              className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingSale(sale)}
                              className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/10 transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </motion.div>

      {/* Diálogos */}
      {editingSale && (
        <EditSaleDialog
          sale={editingSale}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onUpdateSale={handleUpdateSale}
          currentUserProfile={currentUserProfile}
        />
      )}

      <AlertDialog
        open={!!deletingSale}
        onOpenChange={(open) => !open && setDeletingSale(null)}
      >
        <AlertDialogContent className="rounded-[40px] border-none shadow-premium p-10">
          <AlertDialogHeader className="space-y-4">
            <div className="h-16 w-16 rounded-3xl bg-destructive/10 flex items-center justify-center mb-2">
              <Trash2 className="h-8 w-8 text-destructive" />
            </div>
            <AlertDialogTitle className="text-3xl font-black tracking-tight">
              ¿Eliminar esta venta?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base font-medium text-muted-foreground/80 leading-relaxed">
              Esta acción es irreversible. Se borrará el registro para <span className="font-bold text-foreground">{deletingSale?.prospectName}</span> y la unidad <span className="font-bold text-foreground">{deletingSale?.motorcycleModel}</span> se devolverá automáticamente al inventario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel disabled={isDeleting} className="rounded-2xl h-12 px-8 font-bold border-none bg-secondary/50">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteSale} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-2xl h-12 px-8 font-black shadow-lg shadow-destructive/20"
            >
              {isDeleting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Eliminación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={vatFixDialogOpen} onOpenChange={setVatFixDialogOpen}>
        <DialogContent className="rounded-[40px] border-none shadow-premium p-10 max-w-lg">
          <DialogHeader className="space-y-4">
            <div className="h-16 w-16 rounded-3xl bg-orange-500/10 flex items-center justify-center mb-2">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
            <DialogTitle className="text-3xl font-black">Corrección de IVA</DialogTitle>
            <DialogDescription className="text-base font-medium text-muted-foreground/80">
              Esta herramienta detecta ventas registradas con montos enteros (Bruto) y las convierte automáticamente a Monto Neto (Dividiendo entre 1.16).
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 px-6 bg-secondary/20 rounded-2xl border border-border/10">
            {vatFixCandidates.length > 0 ? (
              <p className="font-bold text-primary flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Se encontraron {vatFixCandidates.length} transacciones para corregir.
              </p>
            ) : (
              <p className="text-muted-foreground italic">No se detectaron transacciones con montos enteros.</p>
            )}
          </div>
          <DialogFooter className="mt-6 gap-3">
            <Button
              variant="ghost"
              onClick={() => setVatFixDialogOpen(false)}
              className="rounded-2xl h-12 px-8 font-bold"
            >
              Cancelar
            </Button>
            <Button
              onClick={applyVatFix}
              disabled={vatFixCandidates.length === 0 || isFixingVat}
              className="rounded-2xl h-12 px-8 font-black shadow-xl shadow-primary/20"
            >
              {isFixingVat && (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              )}
              Aplicar Corrección Global
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
