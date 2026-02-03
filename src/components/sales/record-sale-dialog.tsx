"use client";

import { useState, useEffect, useMemo } from "react";
import { PlusCircle, LoaderCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { getUserProfiles, getInventory } from "@/firebase/services";
import type { NewSale, UserProfile, Motorcycle } from "@/lib/data";

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
  const [step, setStep] = useState(1);

  // Data states
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [inventory, setInventory] = useState<Motorcycle[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Form states
  const [salespersonId, setSalespersonId] = useState(currentUserProfile.uid);
  const [prospectName, setProspectName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [creditProvider, setCreditProvider] = useState<"Vento" | "Other" | undefined>(undefined);
  const [selectedMotorcycleId, setSelectedMotorcycleId] = useState("");
  const [soldSku, setSoldSku] = useState("");
  const [amount, setAmount] = useState("");
  
  // Zero-stock alert states
  const [showZeroStockAlert, setShowZeroStockAlert] = useState(false);
  const [specialOrderNotes, setSpecialOrderNotes] = useState("");

  useEffect(() => {
    if (open) {
      setIsLoadingData(true);
      Promise.all([
        getUserProfiles(db),
        getInventory(db),
      ]).then(([profilesData, inventoryData]) => {
        setUserProfiles(profilesData);
        setInventory(inventoryData);
        setIsLoadingData(false);
      });
    }
  }, [db, open]);

  const selectedMotorcycle = useMemo(() => {
    return inventory.find(m => m.id === selectedMotorcycleId) || null;
  }, [inventory, selectedMotorcycleId]);
  
  const resetForm = () => {
    setStep(1);
    setSalespersonId(currentUserProfile.uid);
    setProspectName("");
    setPaymentMethod("");
    setCreditProvider(undefined);
    setSelectedMotorcycleId("");
    setSoldSku("");
    setAmount("");
    setSpecialOrderNotes("");
  }
  
  const handleNextStep = () => {
    if (!salespersonId || !prospectName || !paymentMethod) {
      toast({ variant: "destructive", title: "Missing fields", description: "Please fill out all fields before continuing." });
      return;
    }
    if (paymentMethod === "Financing" && !creditProvider) {
       toast({ variant: "destructive", title: "Missing Credit Provider", description: "Please select a credit provider for financing." });
       return;
    }
    setStep(2);
  }

  const handleMotorcycleSelect = (motorcycleId: string) => {
    setSelectedMotorcycleId(motorcycleId);
    setSoldSku(""); // Reset SKU when motorcycle changes
    const motorcycle = inventory.find(m => m.id === motorcycleId);
    if (motorcycle && motorcycle.stock === 0) {
      setSpecialOrderNotes(""); // ensure it is reset
      setShowZeroStockAlert(true);
    }
  }

  const handleSpecialOrderAndSubmit = (notes: string) => {
      setSpecialOrderNotes(notes);
      setShowZeroStockAlert(false);
      // Use a timeout to ensure state is set before submitting
      setTimeout(() => {
        handleSubmit(notes);
      }, 0);
  }

  const handleSubmit = async (currentSpecialOrderNotes = specialOrderNotes) => {
    if (selectedMotorcycle?.stock === 0 && !currentSpecialOrderNotes) {
      setShowZeroStockAlert(true);
      return;
    }

    if (!selectedMotorcycleId) {
      toast({ variant: "destructive", title: "Motorcycle not selected", description: "Please select a motorcycle model." });
      return;
    }
    if (selectedMotorcycle && selectedMotorcycle.stock > 0 && !soldSku) {
      toast({ variant: "destructive", title: "SKU not selected", description: "Please select the specific SKU being sold." });
      return;
    }
     if (!amount || Number(amount) <= 0) {
      toast({ variant: "destructive", title: "Invalid Amount", description: "Please enter a valid sale amount." });
      return;
    }
    
    setIsSaving(true);
    const newSale: NewSale = {
      salespersonId,
      prospectName,
      amount: Number(amount),
      paymentMethod: paymentMethod as "Cash" | "Financing",
      creditProvider,
      motorcycleId: selectedMotorcycleId,
      motorcycleModel: selectedMotorcycle!.model,
      soldSku,
      notes: currentSpecialOrderNotes,
    };

    try {
      await onAddSale(newSale);
      toast({ title: "Sale Recorded!", description: "The new sale has been successfully added." });
      setOpen(false);
      resetForm();
    } catch (error) {
      // Error is handled by the caller.
    } finally {
        setIsSaving(false);
    }
  };

  const isManager = currentUserProfile.role === 'Manager';

  const renderStepOne = () => (
    <>
      <div className="grid gap-4 py-4">
        {/* Salesperson Select */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="salesperson-id" className="text-right">Salesperson</Label>
          {isManager ? (
            <Select name="salesperson-id" value={salespersonId} onValueChange={setSalespersonId}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select salesperson" />
                </SelectTrigger>
                <SelectContent>
                    {userProfiles.map((sp) => (
                        <SelectItem key={sp.uid} value={sp.uid}>{sp.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          ) : ( <p className="col-span-3 font-medium text-sm">{currentUserProfile.name}</p> )}
        </div>

        {/* Prospect Name */}
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="prospect-name" className="text-right">Prospect</Label>
            <Input id="prospect-name" name="prospect-name" placeholder="John Doe" className="col-span-3" value={prospectName} onChange={(e) => setProspectName(e.target.value)} />
        </div>

        {/* Payment, Credit Provider */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="payment-method" className="text-right">Payment</Label>
          <Select name="payment-method" value={paymentMethod} onValueChange={setPaymentMethod}>
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
            <Select name="credit-provider" value={creditProvider} onValueChange={(v) => setCreditProvider(v as "Vento" | "Other")}>
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
        <Button onClick={handleNextStep}>Next</Button>
      </DialogFooter>
    </>
  );

  const renderStepTwo = () => (
    <>
      <div className="grid gap-4 py-4">
        {/* Motorcycle Selector */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="motorcycle-model" className="text-right">Model</Label>
           <Select name="motorcycle-model" onValueChange={handleMotorcycleSelect} value={selectedMotorcycleId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a model..." />
              </SelectTrigger>
              <SelectContent>
                {inventory.map(moto => (
                  <SelectItem key={moto.id} value={moto.id}>
                    {moto.model} (Stock: {moto.stock})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                {(selectedMotorcycle.skus || []).map(sku => (
                  <SelectItem key={sku} value={sku}>
                    ...{sku.slice(-6)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Amount */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="amount" className="text-right">Amount</Label>
          <Input id="amount" name="amount" type="number" placeholder="35000" className="col-span-3" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
        <Button onClick={() => handleSubmit()} disabled={isSaving}>
          {isSaving && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
          Save Sale
        </Button>
      </DialogFooter>
    </>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetForm();
      }}>
        <DialogTrigger asChild>
          <Button size="sm" className="h-8 gap-1">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Record Sale</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-headline">Record New Sale (Step {step} of 2)</DialogTitle>
              <DialogDescription>
                {step === 1 ? "Fill in the customer and payment details." : "Select the motorcycle and finalize the sale amount."}
              </DialogDescription>
            </DialogHeader>

            {isLoadingData ? (
              <div className="flex items-center justify-center h-48">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              step === 1 ? renderStepOne() : renderStepTwo()
            )}
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
            <AlertDialogCancel onClick={() => setSelectedMotorcycleId("")}>Cancel Sale</AlertDialogCancel>
            <Button variant="secondary" onClick={() => handleSpecialOrderAndSubmit("Recoger en otra sucursal")}>Pickup at another branch</Button>
            <Button onClick={() => handleSpecialOrderAndSubmit("Sobre pedido (CEDIS)")}>Special Order (CEDIS)</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
