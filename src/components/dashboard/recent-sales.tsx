import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pencil, Trash2, LoaderCircle } from "lucide-react"

import type { Sale, UserProfile, NewSale } from "@/lib/data"
import { useMemo, useState } from "react"
import { EXTERNAL_SALESPERSON_ID } from "@/lib/constants"
import { RecordSaleDialog } from "@/components/sales/record-sale-dialog"

interface RecentSalesProps {
  sales: Sale[];
  userProfiles: UserProfile[];
  onDeleteSale?: (sale: Sale) => Promise<void>;
  onUpdateSale?: (saleId: string, originalSale: Sale, updatedData: Partial<NewSale>) => Promise<void>;
  currentUserProfile?: UserProfile | null;
}

export function RecentSales({ sales, userProfiles, onDeleteSale, onUpdateSale, currentUserProfile }: RecentSalesProps) {
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [deletingSale, setDeletingSale] = useState<Sale | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const userProfilesMap = useMemo(() => {
    const map: Record<string, UserProfile> = {};
    userProfiles.forEach(sp => { map[sp.uid] = sp; });
    return map;
  }, [userProfiles]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (deletingSale && onDeleteSale) {
      setIsDeleting(true);
      try {
        await onDeleteSale(deletingSale);
        setDeletingSale(null);
      } finally {
        setIsDeleting(false);
      }
    }
  };
  
  // This function now bridges the dialog and the transactional update hook.
  const handleUpdateSale = async (saleId: string, updatedData: Partial<NewSale>) => {
      if (editingSale && onUpdateSale) {
          await onUpdateSale(editingSale.id, editingSale, updatedData);
      }
  }

  const showActions = !!onDeleteSale && !!onUpdateSale;

  return (
    <>
      <Card className="w-full rounded-3xl shadow-soft border-border/20">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold text-base">Vendedor</TableHead>
                <TableHead className="font-bold text-base">Cliente</TableHead>
                <TableHead className="font-bold text-base">Modelo</TableHead>
                <TableHead className="text-right font-bold text-base">Monto</TableHead>
                {showActions && <TableHead className="w-[50px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showActions ? 5 : 4} className="h-24 text-center text-muted-foreground">
                    Aún no hay ventas registradas.
                  </TableCell>
                </TableRow>
              ) : (
                sales.slice(0, 5).map((sale) => {
                  const isExternal = sale.salespersonId === EXTERNAL_SALESPERSON_ID;
                  const userProfile = isExternal ? null : userProfilesMap[sale.salespersonId];
                  return (
                    <TableRow key={sale.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border-2 border-white shadow-sm"> 
                            <AvatarImage src={userProfile?.avatarUrl} alt="Avatar" />
                            <AvatarFallback className="font-bold">{isExternal ? 'E' : userProfile?.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="font-semibold">{isExternal ? 'Venta Externa' : userProfile?.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-muted-foreground font-medium">{sale.prospectName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-muted-foreground font-medium">{sale.motorcycleModel}</div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-lg">${sale.amount.toLocaleString()}</TableCell>
                      {showActions && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => setEditingSale(sale)}>
                                <Pencil className="mr-2 h-4 w-4" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDeletingSale(sale)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                <Trash2 className="mr-2 h-4 w-4" /> Borrar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editingSale && currentUserProfile && (
        <RecordSaleDialog
          saleToEdit={editingSale}
          onUpdateSale={handleUpdateSale}
          currentUserProfile={currentUserProfile}
          trigger={
            <button className="hidden" onClick={() => setEditingSale(editingSale)}></button>
          }
        />
      )}

      <AlertDialog open={!!deletingSale} onOpenChange={(open) => !open && setDeletingSale(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de que quieres borrar esta venta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se borrará permanentemente el registro de la venta de
              <span className="font-semibold text-foreground"> {deletingSale?.prospectName}</span>
              {deletingSale?.motorcycleModel && (
                  <> y se devolverá la <span className="font-semibold text-foreground">{deletingSale.motorcycleModel}</span> al inventario</>
              )}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl" disabled={isDeleting}>
              {isDeleting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              Sí, borrar venta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
