"use client";

import { useState } from "react";
import { PlusCircle, LoaderCircle, Globe, FileText, MapPin, Upload, Link as LinkIcon, FileCheck } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useStorage } from "@/firebase";
import { addUtility, uploadUtilityFile } from "@/firebase/services";
import type { NewUtility } from "@/lib/data";

const utilitySchema = z.object({
  title: z.string().min(2, "El título es requerido"),
  url: z.string().optional(),
  category: z.enum(["Link", "Document", "Location", "Other"]),
  description: z.string().optional(),
});

type UtilityFormValues = z.infer<typeof utilitySchema>;

interface AddUtilityDialogProps {
  onUtilityAdded: () => void;
}

export function AddUtilityDialog({ onUtilityAdded }: AddUtilityDialogProps) {
  const db = useFirestore();
  const storage = useStorage();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadMode, setUploadMode] = useState<"link" | "file">("link");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Auto-completar título si está vacío
      if (!form.getValues("title")) {
        form.setValue("title", file.name.split('.')[0]);
      }
      // Cambiar categoría a Document si es un archivo
      form.setValue("category", "Document");
    }
  };

  const onSubmit = async (data: UtilityFormValues) => {
    if (uploadMode === "link" && !data.url) {
      form.setError("url", { message: "El enlace es requerido" });
      return;
    }
    if (uploadMode === "file" && !selectedFile) {
      toast({ variant: "destructive", title: "Archivo requerido", description: "Por favor selecciona un documento para subir." });
      return;
    }

    setIsSaving(true);
    try {
      let finalUrl = data.url || "";

      if (uploadMode === "file" && selectedFile) {
        finalUrl = await uploadUtilityFile(storage, selectedFile, data.category);
      }

      const newUtility: NewUtility = {
        title: data.title,
        url: finalUrl,
        category: data.category,
        description: data.description,
      };

      await addUtility(db, newUtility);
      
      toast({
        title: "Recurso guardado",
        description: `"${data.title}" se ha añadido correctamente al centro de utilidades.`,
      });
      
      onUtilityAdded();
      setOpen(false);
      form.reset();
      setSelectedFile(null);
      setUploadMode("link");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo procesar la utilidad.",
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
      <DialogContent className="sm:max-w-md rounded-[32px] shadow-premium max-h-[90vh] overflow-y-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Nueva Utilidad</DialogTitle>
              <DialogDescription>
                Añade herramientas o documentos que faciliten el trabajo del equipo.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título del Recurso</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Tabulador de Precios, VentoCredit..." {...field} className="rounded-xl border-border/40 h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <FormLabel>Tipo de Recurso</FormLabel>
                <Tabs value={uploadMode} onValueChange={(v) => setUploadMode(v as any)} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 rounded-2xl p-1 bg-secondary/50">
                    <TabsTrigger value="link" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
                      <LinkIcon className="h-4 w-4 mr-2" /> Enlace
                    </TabsTrigger>
                    <TabsTrigger value="file" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
                      <Upload className="h-4 w-4 mr-2" /> Archivo
                    </TabsTrigger>
                  </TabsList>
                  
                  <div className="mt-4 p-4 rounded-2xl border border-dashed border-border/60 bg-secondary/10">
                    <TabsContent value="link" className="mt-0">
                      <FormField
                        control={form.control}
                        name="url"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="https://..." {...field} className="rounded-xl border-border/40 bg-background" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    
                    <TabsContent value="file" className="mt-0">
                      <div className="flex flex-col items-center justify-center gap-2">
                        {selectedFile ? (
                          <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl w-full border border-primary/20">
                            <FileCheck className="h-8 w-8 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold truncate">{selectedFile.name}</p>
                              <p className="text-[10px] text-muted-foreground uppercase">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedFile(null)} className="h-8 rounded-lg text-destructive">Cambiar</Button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full h-24 cursor-pointer hover:bg-secondary/20 transition-colors rounded-xl">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload className="w-8 h-8 mb-2 text-muted-foreground/60" />
                              <p className="text-xs text-muted-foreground">PDF, Word, Excel o ODF</p>
                            </div>
                            <input 
                              type="file" 
                              className="hidden" 
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.odt,.ods,.pptx" 
                              onChange={onFileChange}
                            />
                          </label>
                        )}
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría Visual</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl border-border/40 h-11">
                            <SelectValue placeholder="Seleccione tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl">
                          <SelectItem value="Link" className="rounded-xl">🌐 Enlace Web</SelectItem>
                          <SelectItem value="Document" className="rounded-xl">📄 Documento / Archivo</SelectItem>
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
                        placeholder="Ej. Acceso a portal de créditos para modelos 2024..." 
                        {...field} 
                        className="rounded-xl min-h-[80px] border-border/40 resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="bg-secondary/20 -mx-6 -mb-6 p-6 mt-4">
              <Button type="submit" disabled={isSaving} className="w-full h-12 text-lg rounded-2xl shadow-primary/20">
                {isSaving ? (
                  <>
                    <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
                    {uploadMode === "file" ? "Subiendo Archivo..." : "Guardando..."}
                  </>
                ) : (
                  "Guardar en Centro de Utilidades"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
