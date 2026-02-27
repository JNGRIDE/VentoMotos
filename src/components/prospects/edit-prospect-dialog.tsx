"use client";

import { useState, useEffect } from "react";
import { LoaderCircle, User, Briefcase, Bike, MessageSquare, History } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { updateProspect, getUserProfiles } from "@/firebase/services";
import type { Prospect, UserProfile } from "@/lib/data";

const prospectSchema = z.object({
  name: z.string().min(2, "El nombre es requerido"),
  source: z.enum(["Organic", "Advertising"]),
  salespersonId: z.string().min(1, "Vendedor es requerido"),
  stage: z.enum(["Potential", "Appointment", "Credit", "Closed"]),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  rfc: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  occupation: z.string().optional(),
  motorcycleInterest: z.string().optional(),
});

type ProspectFormValues = z.infer<typeof prospectSchema>;

interface EditProspectDialogProps {
  prospect: Prospect;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProspectUpdated: () => void;
  currentUserProfile: UserProfile | null;
}

export function EditProspectDialog({ prospect, open, onOpenChange, onProspectUpdated, currentUserProfile }: EditProspectDialogProps) {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);

  const form = useForm<ProspectFormValues>({
    resolver: zodResolver(prospectSchema),
    defaultValues: {
      name: prospect.name,
      source: prospect.source,
      salespersonId: prospect.salespersonId,
      stage: prospect.stage,
      phone: prospect.phone || "",
      email: prospect.email || "",
      rfc: prospect.rfc || "",
      address: prospect.address || "",
      notes: "",
      occupation: prospect.occupation || "",
      motorcycleInterest: prospect.motorcycleInterest || "",
    },
  });

  useEffect(() => {
    if (open) {
        form.reset({
            name: prospect.name,
            source: prospect.source,
            salespersonId: prospect.salespersonId,
            stage: prospect.stage,
            phone: prospect.phone || "",
            email: prospect.email || "",
            rfc: prospect.rfc || "",
            address: prospect.address || "",
            notes: "",
            occupation: prospect.occupation || "",
            motorcycleInterest: prospect.motorcycleInterest || "",
        });

        if (currentUserProfile?.role === 'Manager') {
            getUserProfiles(db).then(setUserProfiles);
        }
    }
  }, [open, db, currentUserProfile, form, prospect]);

  const onSubmit = async (data: ProspectFormValues) => {
    setIsSaving(true);
    try {
      const updates: Partial<Prospect> = { ...data };

      if (data.stage !== prospect.stage) {
          updates.stageUpdatedAt = new Date().toISOString();
      }

      let currentNotesList = prospect.notesList || [];

      // Migración si existe nota vieja
      if (prospect.notes && currentNotesList.length === 0) {
           currentNotesList = [{
              content: prospect.notes,
              date: prospect.lastContact || new Date().toISOString(),
              author: "Nota Anterior",
           }];
      }

      if (data.notes && data.notes.trim().length > 0) {
          const newNoteObj = {
              content: data.notes,
              date: new Date().toISOString(),
              author: currentUserProfile?.name || "Sistema",
          };
          updates.notesList = [...currentNotesList, newNoteObj];
      } else {
          delete updates.notes;
      }

      await updateProspect(db, prospect.id, updates);
      toast({
        title: "Bitácora Actualizada",
        description: "Los cambios se han guardado en el historial del cliente.",
      });
      onOpenChange(false);
      onProspectUpdated();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar el prospecto.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isManager = currentUserProfile?.role === 'Manager';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto rounded-[32px] border-none shadow-premium p-0 gap-0">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
                <div className="p-8 space-y-8">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-3xl font-bold tracking-tight mb-1">Bitácora de Prospecto</DialogTitle>
                                <DialogDescription className="text-base">
                                    Seguimiento detallado y perfil del cliente.
                                </DialogDescription>
                            </div>
                            <Badge className="h-8 px-4 rounded-full bg-primary/10 text-primary border-none text-sm">
                                {prospect.stage}
                            </Badge>
                        </div>
                    </DialogHeader>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Columna Izquierda: Información Estructurada */}
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <User className="h-4 w-4" /> Datos Personales
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nombre Completo</FormLabel>
                                                <FormControl><Input {...field} className="rounded-xl border-border/40" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Teléfono</FormLabel>
                                                <FormControl><Input {...field} className="rounded-xl border-border/40" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl><Input {...field} className="rounded-xl border-border/40" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Separator className="bg-border/40" />

                            <div className="space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Briefcase className="h-4 w-4" /> Perfil de Interés
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="occupation"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Ocupación</FormLabel>
                                                <FormControl><Input placeholder="Ej. Arquitecto, Uber..." {...field} className="rounded-xl border-border/40" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="motorcycleInterest"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Moto de Interés</FormLabel>
                                                <FormControl><Input placeholder="Ej. Rocketman 250" {...field} className="rounded-xl border-border/40" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <Separator className="bg-border/40" />

                            <div className="space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <History className="h-4 w-4" /> Estado en el Funnel
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="stage"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Etapa Actual</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger className="rounded-xl border-border/40"><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent className="rounded-2xl">
                                                        <SelectItem value="Potential">Potential</SelectItem>
                                                        <SelectItem value="Appointment">Appointment</SelectItem>
                                                        <SelectItem value="Credit">Credit</SelectItem>
                                                        <SelectItem value="Closed">Closed</SelectItem>
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
                                                    <FormLabel>Asignado a</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        </div>

                        {/* Columna Derecha: Timeline / Notion Style Notes */}
                        <div className="bg-secondary/30 rounded-[24px] p-6 space-y-6 flex flex-col h-full min-h-[400px]">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" /> Bitácora de Actividad
                            </h3>
                            
                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 no-scrollbar">
                                {(!prospect.notesList || prospect.notesList.length === 0) && !prospect.notes && (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground/40 italic py-12">
                                        <MessageSquare className="h-12 w-12 mb-2 opacity-20" />
                                        <p className="text-sm">Sin historial de notas.</p>
                                    </div>
                                )}
                                
                                {prospect.notes && (!prospect.notesList || prospect.notesList.length === 0) && (
                                    <div className="glass p-4 rounded-2xl border-none shadow-soft">
                                        <p className="text-sm text-foreground/80 leading-relaxed">{prospect.notes}</p>
                                        <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase">Nota Inicial</p>
                                    </div>
                                )}

                                {prospect.notesList?.slice().reverse().map((note, i) => (
                                    <div key={i} className="bg-card p-4 rounded-2xl shadow-soft border-none transition-all hover:scale-[1.01]">
                                        <p className="text-sm text-foreground/80 leading-relaxed">{note.content}</p>
                                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/40">
                                            <span className="text-[10px] font-bold text-primary">{note.author}</span>
                                            <span className="text-[10px] text-muted-foreground">{new Date(note.date).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4 border-t border-border/40">
                                <FormField
                                    control={form.control}
                                    name="notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="sr-only">Nueva Entrada</FormLabel>
                                            <FormControl>
                                                <Textarea 
                                                    {...field} 
                                                    className="min-h-[100px] rounded-2xl bg-card border-none shadow-inner focus-visible:ring-primary/20 placeholder:text-muted-foreground/50" 
                                                    placeholder="Escribe el siguiente paso del seguimiento..." 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-secondary/50 p-6 flex justify-end items-center gap-4 rounded-b-[32px] mt-auto">
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isSaving} className="rounded-xl px-8 shadow-primary/20">
                        {isSaving && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Cambios
                    </Button>
                </div>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
