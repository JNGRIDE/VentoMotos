"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { format, isValid } from "date-fns";
import {
  Edit,
  LoaderCircle,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  Trash2,
  Filter,
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
import { EditSaleDialog } from "@/components/sales/edit-sale-dialog";
import { useFirestore } from "@/firebase";
import {
  getAllSales,
  updateSaleAndAdjustInventory, // Use transactional update
  batchUpdateSales,
  getUserProfiles,
  getUserProfile,
  deleteSale,
} from "@/firebase/services";
import { useUser } from "@/firebase/auth/use-user";
import type { Sale, NewSale, UserProfile } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";

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
        description: "Failed to load sales data.",
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
      toast({ title: "Success", description: "Sale updated and inventory adjusted." });
      await fetchData(); // Refresh list
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to update sale.",
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
        title: "Sale Deleted",
        description: `Sale from ${deletingSale.prospectName} has been deleted and stock restored.`,
      });
      setDeletingSale(null);
      await fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not delete sale.",
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
        variant: "destructive",
      });
    } finally {
      setIsFixingVat(false);
    }
  };

  const getSalespersonName = (uid: string) => {
    const profile = userProfiles.find((p) => p.uid === uid);
    return profile ? profile.name : "Unknown";
  };

  const formatDate = (date: any) => {
    const d = new Date(date);
    return isValid(d) ? format(d, "dd/MM/yyyy") : "Invalid Date";
  }

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center min-h-[400px]">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (currentUserProfile?.role !== "Manager") {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-theme(spacing.32))]">
        <ShieldAlert className="h-10 w-10 text-destructive" />
        <h2 className="mt-4 text-xl font-semibold">Access Denied</h2>
        <p className="text-muted-foreground mt-2">
          Only managers can access this page.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">
        Sales Control
      </h1>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Select value={salespersonFilter} onValueChange={setSalespersonFilter}>
          <SelectTrigger className="w-full sm:w-[250px] bg-background">
            <SelectValue placeholder="All Salespeople" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Salespeople</SelectItem>
            {userProfiles
              .filter((p) => p.role === "Salesperson")
              .map((p) => (
                <SelectItem key={p.uid} value={p.uid}>
                  {p.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={checkVatFixCandidates}
          className="gap-2 ml-auto"
        >
          <AlertTriangle className="h-4 w-4" />
          Fix Legacy VAT
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Salesperson</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Amount (Net)</TableHead>
              <TableHead className="w-[100px] text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-muted-foreground"
                >
                  No sales found.
                </TableCell>
              </TableRow>
            ) : (
              filteredSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{formatDate(sale.date)}</TableCell>
                  <TableCell>{sale.prospectName}</TableCell>
                  <TableCell>{getSalespersonName(sale.salespersonId)}</TableCell>
                  <TableCell>{sale.motorcycleModel}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{sale.paymentMethod}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {
                      sale.amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(sale)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingSale(sale)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
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

      {/* Delete Alert */}
      <AlertDialog
        open={!!deletingSale}
        onOpenChange={(open) => !open && setDeletingSale(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the sale for{" "}
              <span className="font-bold">{deletingSale?.prospectName}</span> and
              restock the inventory if applicable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSale} disabled={isDeleting}>
              {isDeleting && (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={vatFixDialogOpen} onOpenChange={setVatFixDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fix Legacy VAT</DialogTitle>
            <DialogDescription>
              This tool finds sales with integer amounts (likely Gross) and
              converts them to Net Amount.
            </DialogDescription>
          </DialogHeader>
          <div>
            {vatFixCandidates.length > 0 ? (
              <p>{vatFixCandidates.length} sales found to fix.</p>
            ) : (
              <p>No sales with integer amounts found.</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVatFixDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={applyVatFix}
              disabled={vatFixCandidates.length === 0 || isFixingVat}
            >
              {isFixingVat && (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              )}
              Apply Fix
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
