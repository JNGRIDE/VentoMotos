"use client";

import { useState, useEffect } from "react";
import { PlusCircle, LoaderCircle, ChevronsUpDown, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { getUserProfiles, getInventory } from "@/firebase/db";
import type { NewSale, UserProfile, Motorcycle } from "@/lib/data";
import { cn } from "@/lib/utils";

interface RecordSaleDialogProps {
  onAddSale: (sale: NewSale) => Promise<void>;
  currentUserProfile: UserProfile;
}

export function RecordSaleDialog({ onAddSale, currentUserProfile }: RecordSaleDialogProps) {
  const db = useFirestore();
  const { toast } = useToast();

  // Dialog states
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Data states
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [inventory, setInventory] = useState<Motorcycle[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [paymentMethod, setPaymentMethod] = useState("");
  const [selectedMotorcycle, setSelectedMotorcycle] = useState<Motorcycle | null>(null);
  const [soldSku, setSoldSku] = useState<string>("");

  // Combobox states
  const [comboOpen, setComboOpen] = useState(false);
  
  // Zero-stock alert states
  const [showZeroStockAlert, setShowZeroStockAlert] = useState(false);
  const [specialOrderNotes, setSpecialOrderNotes] = useState("");

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      Promise.all([
        getUserProfiles(db),
        getInventory(db),
      ]).then(([profilesData, inventoryData]) => {
        setUserProfiles(profilesData);
        setInventory(inventoryData);
        setIsLoading(false);
      });
    }
  }, [db, open]);

  const handleMotorcycleSelect = (motorcycle: Motorcycle) => {
    setSelectedMotorcycle(motorcycle);
    setSoldSku(""); // Reset SKU when motorcycle changes
    setComboOpen(false);
    if (motorcycle.stock === 0) {
      setShowZeroStockAlert(true);
    } else {
      setSpecialOrderNotes(""); // Reset notes if stock is available
    }
  }

  const handleSpecialOrder = (notes: string) => {
      setSpecialOrderNotes(notes);
      setShowZeroStockAlert(false);
      // This is a workaround to trigger form submission after the state has been updated.
      setTimeout(() => {
        document.getElementById('record-sale-submit-button')?.click();
      }, 0);
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // If we just opened the zero stock alert, don't submit yet.
    if (selectedMotorcycle?.stock === 0 && specialOrderNotes === "") {
      setShowZeroStockAlert(true);
      return;
    }
    
    setIsSaving(true);
    const formData = new FormData(event.currentTarget);

    if (!selectedMotorcycle) {
      toast({ variant: "destructive", title: "Motorcycle not selected", description: "Please select a motorcycle model." });
      setIsSaving(false);
      return;
    }

    if (!soldSku && selectedMotorcycle.stock > 0) {
      toast({ variant: "destructive", title: "SKU not selected", description: "Please select the specific SKU being sold." });
      setIsSaving(false);
      return;
    }

    const newSale: NewSale = {
      salespersonId: String(formData.get("salesperson-id")),
      prospectName: String(formData.get("prospect-name")),
      amount: Number(formData.get("amount")),
      paymentMethod: formData.get("payment-method") as "Cash" | "Financing",
      creditProvider: formData.get("credit-provider") as "Vento" | "Other" | undefined,
      motorcycleId: selectedMotorcycle.id,
      motorcycleModel: selectedMotorcycle.model,
      soldSku: soldSku, // Pass the selected SKU
      notes: specialOrderNotes, // Add special order notes
    };

    if (!newSale.salespersonId || !newSale.prospectName || !newSale.amount || !newSale.paymentMethod) {
        toast({ variant: "destructive", title: "Missing fields", description: "Please fill out all required fields." });
        setIsSaving(false);
        return;
    }

    try {
      await onAddSale(newSale);
      toast({ title: "Sale Recorded!", description: "The new sale has been successfully added." });
      // Reset state and close
      setOpen(false);
      event.currentTarget.reset();
      setPaymentMethod("");
      setSelectedMotorcycle(null);
      setSoldSku("");
      setSpecialOrderNotes("");
    } catch (error) {
      // Error is handled by the caller, which shows its own toast.
    } finally {
        setIsSaving(false);
    }
  };

  const isManager = currentUserProfile.role === 'Manager';

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="h-8 gap-1">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Record Sale</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="font-headline">Record New Sale</DialogTitle>
              <DialogDescription>Fill in the details. Click save when you're done.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Salesperson Select */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="salesperson-id" className="text-right">Salesperson</Label>
                {isManager ? (
                  <Select name="salesperson-id" defaultValue={currentUserProfile.uid}>
                      <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select salesperson" />
                      </SelectTrigger>
                      <SelectContent>
                          {userProfiles.map((sp) => (
                              <SelectItem key={sp.uid} value={sp.uid}>{sp.name}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                ) : ( <Input id="salesperson-id" name="salesperson-id" type="hidden" value={currentUserProfile.uid} /> )}
                {!isManager && <p className="col-span-3">{currentUserProfile.name}</p>}
              </div>

              {/* Prospect Name */}
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="prospect-name" className="text-right">Prospect</Label>
                  <Input id="prospect-name" name="prospect-name" placeholder="John Doe" className="col-span-3" />
              </div>
              
              {/* Motorcycle Combobox */}
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="motorcycle-model" className="text-right">Model</Label>
                  <Popover open={comboOpen} onOpenChange={setComboOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={comboOpen} className="col-span-3 justify-between font-normal">
                        {selectedMotorcycle ? `${selectedMotorcycle.model} (Stock: ${selectedMotorcycle.stock})` : "Select motorcycle..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Search model..." />
                        <CommandList>
                          <CommandEmpty>No motorcycle found.</CommandEmpty>
                          <CommandGroup>
                            {inventory.map((moto) => (
                              <CommandItem
                                key={moto.id}
                                value={moto.model}
                                onSelect={() => {
                                  handleMotorcycleSelect(moto);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedMotorcycle?.id === moto.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {moto.model}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
              </div>

              {/* SKU Selector */}
              {selectedMotorcycle && selectedMotorcycle.stock > 0 && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="sold-sku" className="text-right">SKU</Label>
                  <Select name="sold-sku" onValueChange={setSoldSku} value={soldSku}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select SKU to sell..." />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedMotorcycle.skus.map(sku => (
                        <SelectItem key={sku} value={sku}>
                          ...{sku.slice(-6)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Amount, Payment, Credit Provider */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">Amount</Label>
                <Input id="amount" name="amount" type="number" placeholder="35000" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="payment-method" className="text-right">Payment</Label>
                <Select name="payment-method" onValueChange={setPaymentMethod}>
                  <SelectTrigger className="col-span-3"><SelectValue placeholder="Select method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Financing">Financing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {paymentMethod === "Financing" && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="credit-provider" className="text-right">Credit</Label>
                  <Select name="credit-provider">
                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Select provider" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Vento">Vento Crédito</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" id="record-sale-submit-button" disabled={isSaving}>
                {isSaving && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Save Sale
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showZeroStockAlert} onOpenChange={setShowZeroStockAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertCircle className="text-destructive"/> Out of Stock</AlertDialogTitle>
            <AlertDialogDescription>
              There are no units of the "{selectedMotorcycle?.model}" model available. How do you want to proceed with this sale?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSpecialOrderNotes("")}>Cancel Sale</AlertDialogCancel>
            <Button variant="secondary" onClick={() => handleSpecialOrder("Recoger en otra sucursal")}>Pickup at another branch</Button>
            <Button onClick={() => handleSpecialOrder("Sobre pedido (CEDIS)")}>Special Order (CEDIS)</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
