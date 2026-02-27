"use client";

import { useState, useEffect } from "react";
import { LoaderCircle, User, Briefcase, MessageSquare, History } from "lucide-react";
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
import { type Prospect, type UserProfile, PROSPECT_STAGES } from "@/lib/data";

const prospectSchema = z.object({
  name: z.string().min(2, "El nombre es requerido"),
  source: z.enum(["Organic", "Advertising"]),
  salespersonId: z.string().min(1, "Vendedor es requerido"),
  stage: z.enum(["Potencial", "Agendado", "Crédito Aprobado", "Caído", "Cerrado"]),
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

        getUserProfiles(db).then(setUserProfiles);
    }
  }, [open, db, form, prospect]);

  const onSubmit = async (data: ProspectFormValues) => {
    setIsSaving(true);
    try {
      const updates: Partial<Prospect> = { ...data };

      if (data.stage !== prospect.stage) {
          updates.stageUpdatedAt = new Date().toISOString();
      }

      let currentNotesList = prospect.notesList || [];

      if (data.notes && data.notes.trim().length > 0) {
          const newNoteObj = {
              content: data.notes,
              date: new Date().toISOString(),
              author: currentUserProfile?.name || "Sistema",
          };
          updates.notesList = [...currentNotesList, newNoteObj];
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
      <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-y-auto rounded-[40px] border-none shadow-premium p-0 gap-0">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
                <div className="p-8 space-y-8">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <DialogTitle className="text-3xl font-black tracking-tight">Bitácora de Prospecto</DialogTitle>
                                <DialogDescription className="text-sm font-medium uppercase tracking-widest text-muted-foreground/60">
                                    Seguimiento comercial • {prospect.name}
                                </DialogDescription>
                            </div>
                            <Badge className="h-10 px-6 rounded-2xl bg-primary text-white border-none text-sm font-bold shadow-lg shadow-primary/20">
                                {prospect.stage}
                            </Badge>
                        </div>
                    </DialogHeader>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Columna Izquierda: Información Estructurada */}
                        <div className="space-y-8">
                            <div className="space-y-6">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                    <User className="h-4 w-4" /> Datos del Cliente
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70">Nombre</FormLabel>
                                                <FormControl><Input {...field} className="rounded-xl border-border/40 bg-secondary/20 h-11 font-semibold" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70">Teléfono</FormLabel>
                                                <FormControl><Input {...field} className="rounded-xl border-border/40 bg-secondary/20 h-11 font-semibold" /></FormControl>
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
                                            <FormLabel className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70">Email</FormLabel>
                                            <FormControl><Input {...field} className="rounded-xl border-border/40 bg-secondary/20 h-11 font-semibold" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Separator className="opacity-40" />

                            <div className="space-y-6">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                    <Briefcase className="h-4 w-4" /> Perfil de Venta
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="occupation"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70">Ocupación</FormLabel>
                                                <FormControl><Input placeholder="Ej. Uber, Arquitecto..." {...field} className="rounded-xl border-border/40 bg-secondary/20 h-11 font-semibold" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="motorcycleInterest"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70">Moto de Interés</FormLabel>
                                                <FormControl><Input placeholder="Ej. Rocketman 250" {...field} className="rounded-xl border-border/40 bg-secondary/20 h-11 font-semibold" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <Separator className="opacity-40" />

                            <div className="space-y-6">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                    <History className="h-4 w-4" /> Proceso Comercial
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="stage"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70">Etapa en el Funnel</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger className="rounded-xl border-border/40 bg-secondary/20 h-11 font-bold"><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent className="rounded-2xl">
                                                        {PROSPECT_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
                                                    <FormLabel className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70">Ejecutivo Asignado</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl><SelectTrigger className="rounded-xl border-border/40 bg-secondary/20 h-11 font-bold"><SelectValue /></SelectTrigger></FormControl>
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

                        {/* Columna Derecha: Timeline Style Notes */}
                        <div className="bg-secondary/40 rounded-[32px] p-6 space-y-6 flex flex-col h-full min-h-[450px] shadow-inner border border-border/10">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" /> Bitácora de Actividad
                            </h3>
                            
                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 no-scrollbar">
                                {(!prospect.notesList || prospect.notesList.length === 0) && (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground/30 italic py-12">
                                        <MessageSquare className="h-12 w-12 mb-3 opacity-10" />
                                        <p className="text-xs font-bold uppercase tracking-widest">Sin entradas previas</p>
                                    </div>
                                )}
                                
                                {prospect.notesList?.slice().reverse().map((note, i) => (
                                    <div key={i} className="bg-card p-5 rounded-[24px] shadow-soft border-none transition-all hover:scale-[1.02] group">
                                        <p className="text-sm font-medium text-foreground/90 leading-relaxed">{note.content}</p>
                                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-border/40">
                                            <div className="flex items-center gap-2">
                                                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-black text-primary uppercase">
                                                    {note.author?.charAt(0)}
                                                </div>
                                                <span className="text-[10px] font-black text-primary uppercase tracking-tighter">{note.author}</span>
                                            </div>
                                            <span className="text-[9px] font-bold text-muted-foreground/50">{new Date(note.date).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4 border-t border-border/20">
                                <FormField
                                    control={form.control}
                                    name="notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="sr-only">Siguiente Paso</FormLabel>
                                            <FormControl>
                                                <Textarea 
                                                    {...field} 
                                                    className="min-h-[120px] rounded-3xl bg-background/80 border-none shadow-premium focus-visible:ring-primary/20 placeholder:text-muted-foreground/40 font-semibold" 
                                                    placeholder="Escribe aquí el seguimiento de hoy... ¿Qué habló el cliente? ¿Qué acordaron?" 
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

                <div className="bg-secondary/60 backdrop-blur-md p-8 flex justify-end items-center gap-4 rounded-b-[40px] mt-auto border-t border-border/10">
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-2xl h-12 px-8 font-bold hover:bg-secondary/80">
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isSaving} className="rounded-2xl h-12 px-10 font-black shadow-lg shadow-primary/20">
                        {isSaving && <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />}
                        Guardar Bitácora
                    </Button>
                </div>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
