"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { Edit, LoaderCircle, AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import { EditSaleDialog } from "@/components/sales/edit-sale-dialog";
import { useFirestore } from "@/firebase";
import { getAllSales, updateSale, batchUpdateSales, getUserProfiles, getUserProfile } from "@/firebase/services";
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

  // Edit Dialog State
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

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

  const handleEditClick = (sale: Sale) => {
    setEditingSale(sale);
    setEditDialogOpen(true);
  };

  const handleUpdateSale = async (saleId: string, oldSale: Sale, newSale: NewSale) => {
      await updateSale(db, saleId, oldSale, newSale);
      await fetchData(); // Refresh list
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
      <div className="flex h-full w-full items-center justify-center">
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">All Sales</h1>
        <Button variant="outline" onClick={checkVatFixCandidates} className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Fix Legacy VAT
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Prospect</TableHead>
              <TableHead>Salesperson</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Amount (Net)</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell>{format(new Date(sale.date), "MMM d, yyyy")}</TableCell>
                <TableCell className="font-medium">{sale.prospectName}</TableCell>
                <TableCell>{getSalespersonName(sale.salespersonId)}</TableCell>
                <TableCell>
                    {sale.motorcycleModel}
                    {sale.soldSku && <div className="text-xs text-muted-foreground">SKU: ...{sale.soldSku.slice(-6)}</div>}
                </TableCell>
                <TableCell>
                    <Badge variant="outline">{sale.paymentMethod}</Badge>
                </TableCell>
                <TableCell className="text-right font-mono">
                    ${sale.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => handleEditClick(sale)}>
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
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

      <Dialog open={vatFixDialogOpen} onOpenChange={setVatFixDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Fix Legacy VAT Amounts</DialogTitle>
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
                  <Button variant="outline" onClick={() => setVatFixDialogOpen(false)}>Cancel</Button>
                  <Button
                    onClick={applyVatFix}
                    disabled={vatFixCandidates.length === 0 || isFixingVat}
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
