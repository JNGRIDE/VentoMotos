"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PlusCircle, LoaderCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { getUserProfiles, getInventory, getFinanciers } from "@/firebase/services";
import type { Sale, NewSale, UserProfile, Motorcycle } from "@/lib/data";
import { EXTERNAL_SALESPERSON_ID } from "@/lib/constants";
import * as fpixel from "@/lib/fpixel";

const saleSchema = z.object({
  salespersonId: z.string().min(1, "Salesperson is required"),
  prospectName: z.string().min(2, "Prospect name is required"),
  paymentMethod: z.enum(["Cash", "Financing"]),
  creditProvider: z.string().optional(),
  motorcycleId: z.string().min(1, "Motorcycle is required"),
  soldSku: z.string().optional(),
  amount: z.coerce.number().positive("Amount must be positive"),
  notes: z.string().optional(),
  isExternal: z.boolean().optional(),
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

interface RecordSaleDialogProps {
  onAddSale?: (sale: NewSale) => Promise<void>;
  onUpdateSale?: (saleId: string, sale: Partial<NewSale>) => Promise<void>;
  currentUserProfile: UserProfile;
  sprint?: string; // Required only for adding
  saleToEdit?: Sale; // The sale to edit
  trigger?: React.ReactNode; // Custom trigger for the dialog
}

export function RecordSaleDialog({ 
    onAddSale, 
    onUpdateSale, 
    currentUserProfile, 
    sprint, 
    saleToEdit, 
    trigger
}: RecordSaleDialogProps) {
  const db = useFirestore();
  const { toast } = useToast();

  const isEditMode = saleToEdit != null;

  const [open, setOpen] = useState(false);
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
    defaultValues: isEditMode
      ? { ...saleToEdit, amount: parseFloat((saleToEdit.amount * 1.16).toFixed(2)) }
      : {
          salespersonId: currentUserProfile.uid,
          prospectName: "",
          paymentMethod: "Cash",
          motorcycleId: "",
          amount: 0,
          isExternal: false,
        },
    mode: "onChange"
  });

  useEffect(() => {
    if (open) {
      setIsLoadingData(true);
      Promise.all([
        getUserProfiles(db),
        getInventory(db),
        getFinanciers(db)
      ]).then(([profilesData, inventoryData, financiersData]) => {
        setUserProfiles(profilesData);
        setInventory(inventoryData);
        setFinanciers(financiersData);
        setIsLoadingData(false);
        
        if (isEditMode) {
            form.reset({
                salespersonId: saleToEdit.salespersonId,
                prospectName: saleToEdit.prospectName,
                paymentMethod: saleToEdit.paymentMethod,
                motorcycleId: saleToEdit.motorcycleId,
                amount: parseFloat((saleToEdit.amount * 1.16).toFixed(2)),
                creditProvider: saleToEdit.creditProvider || "",
                soldSku: saleToEdit.soldSku || "",
                notes: saleToEdit.notes || "",
                isExternal: saleToEdit.isExternal || false,
            });
        } else {
            form.reset({
                salespersonId: currentUserProfile.uid,
                prospectName: "",
                paymentMethod: "Cash",
                motorcycleId: "",
                amount: 0,
                isExternal: false,
            });
        }
        setStep(1);
      });
    }
  }, [db, open, currentUserProfile.uid, form, isEditMode, saleToEdit]);

  const selectedMotorcycleId = form.watch("motorcycleId");
  const selectedMotorcycle = useMemo(() => {
    return inventory.find(m => m.id === selectedMotorcycleId) || null;
  }, [inventory, selectedMotorcycleId]);
  
  const paymentMethod = form.watch("paymentMethod");

  const handleNextStep = async () => {
    const valid = await form.trigger(["salespersonId", "prospectName", "paymentMethod", "creditProvider", "isExternal"]);
    if (valid) setStep(2);
  }

  const handleMotorcycleSelect = (motorcycleId: string) => {
    form.setValue("motorcycleId", motorcycleId);
    form.setValue("soldSku", ""); // Reset SKU
    const motorcycle = inventory.find(m => m.id === motorcycleId);
    if (motorcycle && motorcycle.stock === 0 && !isEditMode) {
      setSpecialOrderNotes(""); // ensure it is reset
      setShowZeroStockAlert(true);
    }
  }

  const handleSpecialOrderAndSubmit = (notes: string) => {
      setSpecialOrderNotes(notes);
      setShowZeroStockAlert(false);
      setTimeout(() => {
        form.handleSubmit((data) => onSubmit(data, notes))();
      }, 0);
  }

  const onSubmit = async (data: SaleFormValues, currentSpecialOrderNotes = specialOrderNotes) => {
    if (selectedMotorcycle?.stock === 0 && !currentSpecialOrderNotes && !isEditMode) {
      setShowZeroStockAlert(true);
      return;
    }

    if (selectedMotorcycle && selectedMotorcycle.stock > 0 && !data.soldSku) {
       form.setError("soldSku", { message: "SKU is required for in-stock items" });
       return;
    }
    
    setIsSaving(true);

    const saleData: Partial<NewSale> = {
      salespersonId: data.salespersonId,
      prospectName: data.prospectName,
      amount: data.amount / 1.16, // Store net amount
      paymentMethod: data.paymentMethod,
      creditProvider: data.paymentMethod === 'Financing' ? data.creditProvider : "",
      motorcycleId: data.motorcycleId,
      motorcycleModel: selectedMotorcycle!.model,
      soldSku: data.soldSku || "",
      notes: currentSpecialOrderNotes || data.notes || "",
      isExternal: data.isExternal ?? false,
    };
    
    try {
      if (isEditMode) {
        await onUpdateSale!(saleToEdit.id, saleData);
        toast({ title: "¡Venta Actualizada!", description: "El registro ha sido modificado con éxito." });
      } else {
        const newSale: NewSale = { ...saleData, sprint: sprint! } as NewSale;
        await onAddSale!(newSale);

        // Tracking Facebook Pixel: Purchase
        fpixel.event('Purchase', {
          value: data.amount,
          currency: 'MXN',
          content_name: selectedMotorcycle?.model,
          content_type: 'product',
        });

        toast({ title: "¡Venta Registrada!", description: "La venta se ha guardado correctamente." });
      }
      setOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Fallo al Guardar", description: error.message || "Ocurrió un error inesperado." });
    } finally {
        setIsSaving(false);
    }
  };

  const isManager = currentUserProfile.role === 'Manager';

  const defaultTrigger = (
    <Button size="sm" className="h-8 gap-1">
        <PlusCircle className="h-3.5 w-3.5" />
        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Record Sale</span>
    </Button>
  );

  const renderStepOne = () => (
    <div className="grid gap-4 py-4">
        <FormField
            control={form.control}
            name="salespersonId"
            render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                    <FormLabel className="text-right">Salesperson</FormLabel>
                    <div className="col-span-3">
                        {isManager ? (
                             <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select salesperson" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value={EXTERNAL_SALESPERSON_ID}>External Sale (No Commission)</SelectItem>
                                    {userProfiles.map((sp) => (
                                        <SelectItem key={sp.uid} value={sp.uid}>{sp.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                             <Input value={currentUserProfile.name} disabled className="bg-muted" />
                        )}
                        <FormMessage />
                    </div>
                </FormItem>
            )}
        />
        {!isManager && <FormField control={form.control} name="isExternal" render={({ field }) => (<FormItem className="grid grid-cols-4 items-center gap-4 space-y-0"><FormLabel className="text-right">External Sale</FormLabel><div className="col-span-3 flex flex-col gap-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormDescription>If checked, this sale will count towards your personal goal but not the branch goal.</FormDescription><FormMessage /></div></FormItem>)} />}
        <FormField control={form.control} name="prospectName" render={({ field }) => (<FormItem className="grid grid-cols-4 items-center gap-4 space-y-0"><FormLabel className="text-right">Prospect</FormLabel><div className="col-span-3"><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></div></FormItem>)} />
        <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                    <FormLabel className="text-right">Payment</FormLabel>
                    <div className="col-span-3">
                         <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="Cash">Cash</SelectItem>
                                <SelectItem value="Financing">Financing</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </div>
                </FormItem>
            )}
        />
        {paymentMethod === "Financing" && (
            <FormField
                control={form.control}
                name="creditProvider"
                render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                        <FormLabel className="text-right">Credit</FormLabel>
                        <div className="col-span-3">
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger></FormControl>
                                <SelectContent>{financiers.map((f) => (<SelectItem key={f} value={f}>{f}</SelectItem>))}</SelectContent>
                            </Select>
                            <FormMessage />
                        </div>
                    </FormItem>
                )}
            />
        )}
      </div>
  );

  const renderStepTwo = () => (
    <div className="grid gap-4 py-4">
         <FormField
            control={form.control}
            name="motorcycleId"
            render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                    <FormLabel className="text-right">Model</FormLabel>
                    <div className="col-span-3">
                        <Select onValueChange={handleMotorcycleSelect} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select a model..." /></SelectTrigger></FormControl>
                            <SelectContent>
                                {inventory.map(moto => (<SelectItem key={moto.id} value={moto.id}>{moto.model} (Stock: {moto.stock})</SelectItem>))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </div>
                </FormItem>
            )}
        />
        {selectedMotorcycle && selectedMotorcycle.stock > 0 && (
            <FormField
                control={form.control}
                name="soldSku"
                render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                        <FormLabel className="text-right">SKU</FormLabel>
                        <div className="col-span-3">
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select SKU to sell..." /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {(selectedMotorcycle.skus || []).map(sku => (<SelectItem key={sku} value={sku}>...{sku.slice(-6)}</SelectItem>))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </div>
                    </FormItem>
                )}
            />
        )}
        <FormField control={form.control} name="amount" render={({ field }) => (<FormItem className="grid grid-cols-4 items-center gap-4 space-y-0"><FormLabel className="text-right">Amount</FormLabel><div className="col-span-3"><FormControl><Input type="number" placeholder="35000" {...field} /></FormControl><FormMessage /></div></FormItem>)} />
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || defaultTrigger}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-headline">{isEditMode ? "Edit Sale" : "Record New Sale"} (Step {step} of 2)</DialogTitle>
              <DialogDescription>
                {step === 1 ? "Fill in the customer and payment details." : "Select the motorcycle and finalize the sale amount."}
              </DialogDescription>
            </DialogHeader>

            {isLoadingData ? (
              <div className="flex items-center justify-center h-48"><LoaderCircle className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => onSubmit(data))}>
                        {step === 1 ? renderStepOne() : renderStepTwo()}
                        <DialogFooter>
                             {step === 1 ? (
                                <Button type="button" onClick={handleNextStep}>Next</Button>
                             ) : (
                                <>
                                    <Button type="button" variant="ghost" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                                    <Button type="submit" disabled={isSaving}>
                                        {isSaving && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                        {isEditMode ? "Save Changes" : "Save Sale"}
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
        <AlertDialogContent className="max-w-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl">
              <AlertCircle className="text-destructive h-6 w-6"/> 
              Modelo sin Existencias
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base py-2">
              Actualmente no hay unidades disponibles del modelo <span className="font-bold text-foreground">"{selectedMotorcycle?.model}"</span> en esta sucursal. 
              ¿Cómo deseas proceder con esta venta?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:space-x-0">
            <AlertDialogCancel 
              onClick={() => form.setValue("motorcycleId", "")}
              className="mt-0 sm:mr-auto"
            >
              Cancelar Registro
            </AlertDialogCancel>
            <Button 
              variant="secondary" 
              onClick={() => handleSpecialOrderAndSubmit("Recoger en otra sucursal")}
              className="w-full sm:w-auto"
            >
              Recoger en otra sucursal
            </Button>
            <Button 
              onClick={() => handleSpecialOrderAndSubmit("Sobre pedido (CEDIS)")}
              className="w-full sm:w-auto"
            >
              Sobre pedido (CEDIS)
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
