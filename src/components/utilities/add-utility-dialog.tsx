"use client";

import { useState } from "react";
import { PlusCircle, LoaderCircle, Globe, FileText, MapPin, HelpCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { addUtility } from "@/firebase/services";
import type { NewUtility } from "@/lib/data";

const utilitySchema = z.object({
  title: z.string().min(2, "El título es requerido"),
  url: z.string().url("Debe ser una URL válida (ej. https://...)"),
  category: z.enum(["Link", "Document", "Location", "Other"]),
  description: z.string().optional(),
});

type UtilityFormValues = z.infer<typeof utilitySchema>;

interface AddUtilityDialogProps {
  onUtilityAdded: () => void;
}

export function AddUtilityDialog({ onUtilityAdded }: AddUtilityDialogProps) {
  const db = useFirestore();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const form = useForm<UtilityFormValues>({
    resolver: zodResolver(utilitySchema),
    defaultValues: {
      title: "",
      url: "",
      category: "Link",
      description: "",
    },
  });

  const onSubmit = async (data: UtilityFormValues) => {
    setIsSaving(true);
    try {
      await addUtility(db, data);
      toast({
        title: "Utilidad añadida",
        description: `"${data.title}" ya está disponible para todo el equipo.`,
      });
      onUtilityAdded();
      setOpen(false);
      form.reset();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo guardar la utilidad.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="rounded-3xl shadow-primary/20 gap-2">
          <PlusCircle className="h-5 w-5" />
          Añadir Utilidad
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-[32px] shadow-premium">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Nueva Utilidad</DialogTitle>
              <DialogDescription>
                Añade herramientas que faciliten el trabajo diario del equipo.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título del Recurso</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. VentoCredit, Manual de Garantías..." {...field} className="rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL / Enlace</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} className="rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Seleccione tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl">
                          <SelectItem value="Link" className="rounded-xl">🌐 Enlace Web</SelectItem>
                          <SelectItem value="Document" className="rounded-xl">📄 Documento / PDF</SelectItem>
                          <SelectItem value="Location" className="rounded-xl">📍 Ubicación / Mapa</SelectItem>
                          <SelectItem value="Other" className="rounded-xl">🔧 Otro recurso</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción Corta (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Explica para qué sirve este link..." 
                        {...field} 
                        className="rounded-xl min-h-[80px] resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="bg-secondary/20 -mx-6 -mb-6 p-6 mt-4">
              <Button type="submit" disabled={isSaving} className="w-full h-12 text-lg rounded-2xl shadow-primary/20">
                {isSaving && <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />}
                Guardar en Centro de Utilidades
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
