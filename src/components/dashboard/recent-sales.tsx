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
import { EditSaleDialog } from "@/components/sales/edit-sale-dialog"

interface RecentSalesProps {
  sales: Sale[];
  userProfiles: UserProfile[];
  onDeleteSale?: (sale: Sale) => Promise<void>;
  onUpdateSale?: (saleId: string, oldSale: Sale, newSale: NewSale) => Promise<void>;
  currentUserProfile?: UserProfile | null;
}

export function RecentSales({ sales, userProfiles, onDeleteSale, onUpdateSale, currentUserProfile }: RecentSalesProps) {
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [deletingSale, setDeletingSale] = useState<Sale | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const userProfilesMap = useMemo(() => {
    return userProfiles.reduce((map, sp) => {
      map[sp.uid] = sp;
      return map;
    }, {} as Record<string, UserProfile>);
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

  const showActions = !!onDeleteSale && !!onUpdateSale;

  return (
    <>
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle className="font-headline">Recent Sales</CardTitle>
          <CardDescription>
            A log of the most recent motorcycle sales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Salesperson</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                {showActions && <TableHead className="w-[50px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showActions ? 5 : 4} className="h-24 text-center text-muted-foreground">
                    No sales recorded yet.
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
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={userProfile?.avatarUrl} alt="Avatar" />
                            <AvatarFallback>{isExternal ? 'EX' : userProfile?.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="font-medium">{isExternal ? 'External Sale' : userProfile?.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-muted-foreground">{sale.prospectName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-muted-foreground">{sale.motorcycleModel}</div>
                      </TableCell>
                      <TableCell className="text-right font-medium">${sale.amount.toLocaleString()}</TableCell>
                      {showActions && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => setEditingSale(sale)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDeletingSale(sale)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
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

      {editingSale && onUpdateSale && (
        <EditSaleDialog
          sale={editingSale}
          open={!!editingSale}
          onOpenChange={(open) => !open && setEditingSale(null)}
          onUpdateSale={onUpdateSale}
          currentUserProfile={currentUserProfile || undefined}
        />
      )}

      <AlertDialog open={!!deletingSale} onOpenChange={(open) => !open && setDeletingSale(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the sale record for
              <span className="font-medium text-foreground"> {deletingSale?.prospectName}</span>
              {deletingSale?.motorcycleModel && (
                  <> and return the <span className="font-medium text-foreground">{deletingSale.motorcycleModel}</span> to inventory</>
              )}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isDeleting}>
              {isDeleting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
