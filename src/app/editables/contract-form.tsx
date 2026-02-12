"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
// @ts-ignore
import JSZipUtils from "jszip-utils";
import { saveAs } from "file-saver";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { contractSchema, ContractFormValues } from "./schema";
import { Loader2 } from "lucide-react";

export function ContractForm() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      dia: new Date().getDate().toString(),
      mes: new Date().toLocaleString("es-ES", { month: "long" }),
      año: new Date().getFullYear().toString(),
      nombre_comprador: "",
      rfc: "",
      email: "",
      celular: "",
      calle: "",
      numero_ext: "",
      colonia: "",
      delegacion: "",
      estado: "",
      codigo_postal: "",
      submarca: "",
      version: "",
      año_modelo: "",
      color: "",
      precio_numero: "",
      precio_letras: "",
      precio_total: "",
      forma_de_pago: "",
    },
  });

  const loadFile = (url: string, callback: (err: Error | null, data: string | null) => void) => {
    JSZipUtils.getBinaryContent(url, callback);
  };

  const onSubmit = (data: ContractFormValues) => {
    setIsLoading(true);
    loadFile("/templates/contrato-profeco.docx", function (error: Error | null, content: string | null) {
      if (error) {
        console.error(error);
        setIsLoading(false);
        alert("Error al cargar la plantilla: " + error.message);
        return;
      }

      if (!content) {
        setIsLoading(false);
        alert("Error: El contenido de la plantilla está vacío.");
        return;
      }

      try {
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
        });

        // Render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
        doc.render(data);

        const out = doc.getZip().generate({
          type: "blob",
          mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        // Output the document using Data-URI
        saveAs(out, `Contrato-${data.nombre_comprador || "Generado"}.docx`);
        setIsLoading(false);
      } catch (error: any) {
        setIsLoading(false);
        console.error(error);
        if (error.properties && error.properties.errors instanceof Array) {
          const errorMessages = error.properties.errors
            .map(function (error: any) {
              return error.properties.explanation;
            })
            .join("\n");
          alert("Error al generar el documento:\n" + errorMessages);
        } else {
          alert("Error al generar el documento: " + error);
        }
      }
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Generar Contrato PROFECO</CardTitle>
        <CardDescription>
          Llena el formulario para generar el contrato en formato Word.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Información del Contrato</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="dia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Día</FormLabel>
                      <FormControl>
                        <Input placeholder="DD" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mes</FormLabel>
                      <FormControl>
                        <Input placeholder="MM" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="año"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Año</FormLabel>
                      <FormControl>
                        <Input placeholder="AAAA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Datos del Comprador</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nombre_comprador"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre Apellido" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rfc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RFC</FormLabel>
                      <FormControl>
                        <Input placeholder="RFC" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo Electrónico</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="correo@ejemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="celular"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono Celular</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="10 dígitos" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Dirección</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="calle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calle</FormLabel>
                      <FormControl>
                        <Input placeholder="Calle" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="numero_ext"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número Ext.</FormLabel>
                        <FormControl>
                          <Input placeholder="Num" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="codigo_postal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>C.P.</FormLabel>
                        <FormControl>
                          <Input placeholder="00000" maxLength={5} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="colonia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Colonia</FormLabel>
                      <FormControl>
                        <Input placeholder="Colonia" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="delegacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delegación/Municipio</FormLabel>
                      <FormControl>
                        <Input placeholder="Delegación" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <FormControl>
                        <Input placeholder="Estado" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Datos de la Motocicleta</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="submarca"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Submarca (Modelo)</FormLabel>
                      <FormControl>
                        <Input placeholder="Modelo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="version"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo o Versión</FormLabel>
                      <FormControl>
                        <Input placeholder="Versión" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="año_modelo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Año-Modelo</FormLabel>
                      <FormControl>
                        <Input placeholder="AAAA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <Input placeholder="Color" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Detalles de Pago</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="precio_numero"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio Total (Número)</FormLabel>
                      <FormControl>
                        <Input placeholder="10000" type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="precio_total"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio Total (Formato Carátula)</FormLabel>
                      <FormControl>
                        <Input placeholder="$10,000.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="precio_letras"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio Total (Letra)</FormLabel>
                        <FormControl>
                          <Input placeholder="DIEZ MIL PESOS 00/100 M.N." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="forma_de_pago"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de Pago</FormLabel>
                      <FormControl>
                        <Input placeholder="Contado / Crédito" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generar Contrato
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
