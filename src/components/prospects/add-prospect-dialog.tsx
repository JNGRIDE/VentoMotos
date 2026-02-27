"use client";

import { useState, useEffect } from "react";
import { PlusCircle, LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { addProspect, getUserProfiles } from "@/firebase/services";
import type { NewProspect, UserProfile } from "@/lib/data";

const addProspectSchema = z.object({
  name: z.string().min(2, "El nombre es requerido"),
  source: z.enum(["Organic", "Advertising"]),
  salespersonId: z.string().min(1, "Vendedor es requerido"),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  notes: z.string().optional(),
  occupation: z.string().optional(),
  motorcycleInterest: z.string().optional(),
});

type AddProspectFormValues = z.infer<typeof addProspectSchema>;

interface AddProspectDialogProps {
  sprint: string;
  currentUserProfile: UserProfile;
  onProspectAdded: () => void;
}

export function AddProspectDialog({ sprint, currentUserProfile, onProspectAdded }: AddProspectDialogProps) {
  const db = useFirestore();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const { toast } = useToast();

  const form = useForm<AddProspectFormValues>({
    resolver: zodResolver(addProspectSchema),
    defaultValues: {
      name: "",
      source: "Organic",
      salespersonId: currentUserProfile.uid,
      phone: "",
      email: "",
      notes: "",
      occupation: "",
      motorcycleInterest: "",
    },
  });

  const { uid, role } = currentUserProfile;

  useEffect(() => {
    if (open) {
        form.reset({
             name: "",
             source: "Organic",
             salespersonId: uid,
             phone: "",
             email: "",
             notes: "",
             occupation: "",
             motorcycleInterest: "",
        });

        if (role === 'Manager') {
            getUserProfiles(db).then(setUserProfiles);
        }
    }
  }, [open, db, uid, role, form]);

  const handleSubmit = async (data: AddProspectFormValues) => {
    setIsSaving(true);
    
    const newProspect: NewProspect = {
      name: data.name,
      sprint,
      source: data.source,
      salespersonId: data.salespersonId,
      stage: "Potential",
      lastContact: new Date().toISOString(),
      stageUpdatedAt: new Date().toISOString(),
      phone: data.phone,
      email: data.email,
      notes: data.notes,
      occupation: data.occupation,
      motorcycleInterest: data.motorcycleInterest,
      notesList: data.notes ? [{ content: data.notes, date: new Date().toISOString(), author: currentUserProfile.name }] : [],
    };

    try {
      await addProspect(db, newProspect);
      toast({
        title: "Nuevo Prospecto!",
        description: `${data.name} ha sido añadido a tu embudo.`,
      });
      onProspectAdded();
      setOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo añadir el prospecto.",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const isManager = currentUserProfile.role === 'Manager';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1 rounded-xl shadow-primary/20">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Añadir Prospecto
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto rounded-[32px] shadow-premium">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Nuevo Lead</DialogTitle>
                <DialogDescription>
                Registra los datos básicos para iniciar el seguimiento.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre del Cliente *</FormLabel>
                            <FormControl><Input {...field} className="rounded-xl border-border/40" /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Teléfono</FormLabel>
                                <FormControl><Input {...field} type="tel" className="rounded-xl border-border/40" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="motorcycleInterest"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Interés</FormLabel>
                                <FormControl><Input placeholder="Modelo..." {...field} className="rounded-xl border-border/40" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                
                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Primeras Notas de Seguimiento</FormLabel>
                            <FormControl>
                                <Textarea {...field} className="min-h-[80px] rounded-xl border-border/40" placeholder="¿Cómo nos conoció? ¿Qué busca?" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="source"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Fuente</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger className="rounded-xl border-border/40"><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent className="rounded-2xl">
                                        <SelectItem value="Organic">Organic</SelectItem>
                                        <SelectItem value="Advertising">Advertising</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {isManager && (
                    <FormField
                            control={form.control}
                            name="salespersonId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Asignar a</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger className="rounded-xl border-border/40"><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent className="rounded-2xl">
                                            {userProfiles.map(p => <SelectItem key={p.uid} value={p.uid}>{p.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                </div>
            </div>
            <DialogFooter className="bg-secondary/20 -mx-6 -mb-6 p-6 mt-4">
                <Button type="submit" disabled={isSaving} className="w-full h-12 text-lg rounded-xl shadow-primary/20">
                {isSaving && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Registrar Prospecto
                </Button>
            </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
