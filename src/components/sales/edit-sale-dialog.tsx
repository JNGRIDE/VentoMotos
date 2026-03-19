"use client";

import { useState, useEffect, useMemo } from "react";
import { LoaderCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { getUserProfiles, getInventory, getFinanciers } from "@/firebase/services";
import type { NewSale, Sale, UserProfile, Motorcycle } from "@/lib/data";
import { EXTERNAL_SALESPERSON_ID } from "@/lib/constants";

const saleSchema = z.object({
  salespersonId: z.string().min(1, "Salesperson is required"),
  prospectName: z.string().min(2, "Prospect name is required"),
  paymentMethod: z.enum(["Cash", "Financing"]),
  creditProvider: z.string().optional(),
  motorcycleId: z.string().min(1, "Motorcycle is required"),
  soldSku: z.string().optional(),
  amount: z.coerce.number().positive("Amount must be positive"),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.paymentMethod === 'Financing' && !data.creditProvider) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Credit provider is required for financing",
            path: ["creditProvider"]
        });
    }
});

type SaleFormValues = z.infer<typeof saleSchema>;

interface EditSaleDialogProps {
  sale: Sale;
  onUpdateSale: (updatedData: Partial<NewSale>) => Promise<void>; 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserProfile?: UserProfile | null;
}

export function EditSaleDialog({ sale, onUpdateSale, open, onOpenChange, currentUserProfile }: EditSaleDialogProps) {
  const db = useFirestore();
  const { toast } = useToast();

  const [isSaving, setIsSaving] = useState(false);
  const [step, setStep] = useState(1);

  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [inventory, setInventory] = useState<Motorcycle[]>([]);
  const [financiers, setFinanciers] = useState<string[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const [showZeroStockAlert, setShowZeroStockAlert] = useState(false);
  const [specialOrderNotes, setSpecialOrderNotes] = useState("");

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    // Initialize with sale data directly
    defaultValues: {
        salespersonId: sale.salespersonId,
        prospectName: sale.prospectName,
        paymentMethod: sale.paymentMethod,
        creditProvider: sale.creditProvider || undefined,
        motorcycleId: sale.motorcycleId,
        soldSku: sale.soldSku,
        amount: Math.round(sale.amount * 1.16), // Display Gross
        notes: sale.notes || "",
    },
    mode: "onChange"
  });

  useEffect(() => {
      // When the dialog opens with a new sale, reset the form and state
      if (open) {
          form.reset({
              salespersonId: sale.salespersonId,
              prospectName: sale.prospectName,
              paymentMethod: sale.paymentMethod,
              creditProvider: sale.creditProvider || undefined,
              motorcycleId: sale.motorcycleId,
              soldSku: sale.soldSku,
              amount: Math.round(sale.amount * 1.16),
              notes: sale.notes || "",
          });
          setSpecialOrderNotes(sale.notes || "");
          setStep(1); 
      }
  }, [sale, open, form]);

  useEffect(() => {
    if (open && db) {
      setIsLoadingData(true);
      Promise.all([
        getUserProfiles(db),
        getInventory(db),
        getFinanciers(db)
      ]).then(([profilesData, inventoryData, financiersData]) => {
        setUserProfiles(profilesData.filter(p => p.role === 'Salesperson')); // <-- FIX: Only show salespeople
        setInventory(inventoryData);
        setFinanciers(financiersData);
        setIsLoadingData(false);
      }).catch(err => {
          console.error("Failed to load dialog data:", err);
          setIsLoadingData(false);
          toast({ title: "Error", description: "Could not load necessary data for editing.", variant: "destructive" });
      });
    }
  }, [db, open, toast]);

  const selectedMotorcycleId = form.watch("motorcycleId");

  const selectedMotorcycle = useMemo(() => {
    return inventory.find(m => m.id === selectedMotorcycleId) || null;
  }, [inventory, selectedMotorcycleId]);

  const availableSkus = useMemo(() => {
      if (!selectedMotorcycle) return [];
      let skus = [...(selectedMotorcycle.skus || [])];

      if (selectedMotorcycle.id === sale.motorcycleId && sale.soldSku && !sale.notes) {
          if (!skus.includes(sale.soldSku)) {
              skus.push(sale.soldSku);
          }
      }
      return skus;
  }, [selectedMotorcycle, sale]);

  const paymentMethod = form.watch("paymentMethod");

  const handleNextStep = async () => {
    const valid = await form.trigger(["salespersonId", "prospectName", "paymentMethod", "creditProvider"]);
    if (valid) setStep(2);
  }

  const handleMotorcycleSelect = (motorcycleId: string) => {
    form.setValue("motorcycleId", motorcycleId);
    form.setValue("soldSku", motorcycleId === sale.motorcycleId ? sale.soldSku : "");

    const motorcycle = inventory.find(m => m.id === motorcycleId);
    if (motorcycle && motorcycle.stock === 0 && motorcycleId !== sale.motorcycleId) {
      setSpecialOrderNotes("");
      setShowZeroStockAlert(true);
    } else {
      setSpecialOrderNotes("");
    }
  }

  const handleSpecialOrderAndSubmit = (notes: string) => {
      setShowZeroStockAlert(false);
      setTimeout(() => {
        form.handleSubmit((data) => onSubmit(data, notes))();
      }, 0);
  }

  const onSubmit = async (data: SaleFormValues, currentSpecialOrderNotes = specialOrderNotes) => {
    if (selectedMotorcycle?.stock === 0 && selectedMotorcycle.id !== sale.motorcycleId && !currentSpecialOrderNotes) {
      setShowZeroStockAlert(true);
      return;
    }
    if (selectedMotorcycle && !data.soldSku && availableSkus.length > 0 && !currentSpecialOrderNotes) {
       form.setError("soldSku", { message: "SKU is required for in-stock items" });
       return;
    }

    setIsSaving(true);

    const newSaleData: Partial<NewSale> = {
      salespersonId: data.salespersonId,
      prospectName: data.prospectName,
      amount: data.amount / 1.16, // Store Net Amount
      paymentMethod: data.paymentMethod,
      creditProvider: data.paymentMethod === 'Financing' ? data.creditProvider : "",
      motorcycleId: data.motorcycleId,
      motorcycleModel: selectedMotorcycle!.model,
      soldSku: data.soldSku || "",
      notes: currentSpecialOrderNotes || data.notes || "",
    };

    try {
      await onUpdateSale(newSaleData);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const isManager = currentUserProfile?.role === 'Manager';

    return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-headline">Edit Sale (Step {step} of 2)</DialogTitle>
              <DialogDescription>
                {step === 1 ? "Update the customer and payment details." : "Update the motorcycle and sale amount."}
              </DialogDescription>
            </DialogHeader>

            {isLoadingData ? (
              <div className="flex items-center justify-center h-48">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
                <Form {...form}>
                    <form>
                        {step === 1 ? (
                            <div className="grid gap-4 py-4">
                                <FormField control={form.control} name="salespersonId" render={({ field }) => (
                                    <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0"><FormLabel className="text-right">Salesperson</FormLabel><div className="col-span-3"><Select onValueChange={field.onChange} value={field.value} disabled={!isManager}><FormControl><SelectTrigger><SelectValue placeholder="Select salesperson" /></SelectTrigger></FormControl><SelectContent><SelectItem value={EXTERNAL_SALESPERSON_ID}>External Sale (No Commission)</SelectItem>{userProfiles.map((sp) => (<SelectItem key={sp.uid} value={sp.uid}>{sp.name}</SelectItem>))}</SelectContent></Select><FormMessage /></div></FormItem>)}
                                />
                                <FormField control={form.control} name="prospectName" render={({ field }) => (
                                    <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0"><FormLabel className="text-right">Prospect</FormLabel><div className="col-span-3"><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></div></FormItem>)}
                                />
                                <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                                    <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0"><FormLabel className="text-right">Payment</FormLabel><div className="col-span-3"><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Cash">Cash</SelectItem><SelectItem value="Financing">Financing</SelectItem></SelectContent></Select><FormMessage /></div></FormItem>)}
                                />
                                {paymentMethod === "Financing" && (
                                    <FormField control={form.control} name="creditProvider" render={({ field }) => (
                                        <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0"><FormLabel className="text-right">Credit</FormLabel><div className="col-span-3"><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger></FormControl><SelectContent>{financiers.map((f) => (<SelectItem key={f} value={f}>{f}</SelectItem>))}</SelectContent></Select><FormMessage /></div></FormItem>)}
                                    />
                                )}
                            </div>
                        ) : (
                            <div className="grid gap-4 py-4">
                                <FormField control={form.control} name="motorcycleId" render={({ field }) => (
                                    <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0"><FormLabel className="text-right">Model</FormLabel><div className="col-span-3"><Select onValueChange={handleMotorcycleSelect} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a model..." /></SelectTrigger></FormControl><SelectContent>{inventory.map(moto => (<SelectItem key={moto.id} value={moto.id}>{moto.model} (Stock: {moto.stock})</SelectItem>))}</SelectContent></Select><FormMessage /></div></FormItem>)}
                                />
                                {(selectedMotorcycle && (selectedMotorcycle.stock > 0 || (selectedMotorcycle.id === sale.motorcycleId && sale.soldSku))) && (
                                    <FormField control={form.control} name="soldSku" render={({ field }) => (
                                        <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0"><FormLabel className="text-right">SKU</FormLabel><div className="col-span-3"><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select SKU to sell..." /></SelectTrigger></FormControl><SelectContent>{availableSkus.map(sku => (<SelectItem key={sku} value={sku}>...{sku.slice(-6)}</SelectItem>))}</SelectContent></Select><FormMessage /></div></FormItem>)}
                                    />
                                )}
                                <FormField control={form.control} name="amount" render={({ field }) => (
                                    <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0"><FormLabel className="text-right">Amount</FormLabel><div className="col-span-3"><FormControl><Input type="number" placeholder="35000" {...field} /></FormControl><FormMessage /></div></FormItem>)}
                                />
                            </div>
                        )}
                        <DialogFooter>
                             {step === 1 ? (
                                <Button type="button" onClick={handleNextStep}>Next</Button>
                             ) : (
                                <>
                                    <Button type="button" variant="ghost" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                                    <Button type="button" onClick={form.handleSubmit((data) => onSubmit(data))} disabled={isSaving}>
                                        {isSaving && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Changes
                                    </Button>
                                </>
                             )}
                        </DialogFooter>
                    </form>
                </Form>
            )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showZeroStockAlert} onOpenChange={setShowZeroStockAlert}>
        <AlertDialogContent className="sm:max-w-2xl rounded-[32px] border-none shadow-2xl p-8">
          <AlertDialogHeader className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-destructive/10 p-2 rounded-full">
                <AlertCircle className="text-destructive h-6 w-6"/> 
              </div>
              <AlertDialogTitle className="text-2xl font-bold tracking-tight">
                Modelo sin Existencias
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-lg text-muted-foreground leading-relaxed">
              Actualmente no hay unidades disponibles del modelo <span className="font-bold text-foreground">"{selectedMotorcycle?.model}"</span>. 
              <br className="hidden sm:block" />
              ¿Deseas cambiar el tipo de pedido?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row items-center gap-3 mt-8">
            <AlertDialogCancel 
              onClick={() => form.setValue("motorcycleId", sale.motorcycleId)}
              className="w-full sm:w-auto rounded-2xl h-12 px-6 font-semibold border-none bg-secondary/50 hover:bg-secondary order-3 sm:order-1"
            >
              Cancelar Cambio
            </AlertDialogCancel>
            <div className="hidden sm:block flex-1 order-2" />
            <Button 
              variant="secondary" 
              onClick={() => handleSpecialOrderAndSubmit("Recoger en otra sucursal")}
              className="w-full sm:w-auto rounded-2xl h-12 px-6 font-semibold bg-secondary hover:bg-secondary/80 order-2 sm:order-3"
            >
              Recoger en otra sucursal
            </Button>
            <Button 
              onClick={() => handleSpecialOrderAndSubmit("Sobre pedido (CEDIS)")}
              className="w-full sm:w-auto rounded-2xl h-12 px-6 font-bold shadow-lg shadow-primary/20 order-1 sm:order-4"
            >
              Sobre pedido (CEDIS)
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

}
