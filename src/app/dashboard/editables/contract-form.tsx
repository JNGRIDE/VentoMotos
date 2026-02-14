"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

import { contractSchema, ContractFormValues } from "./schema";
import { USO_CFDI, REGIMEN_FISCAL } from "@/lib/fiscal-data";
import { formatCurrency, numberToWordsMX } from "@/lib/format-utils";

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
      regimen_fiscal: "",
      uso_cfdi: "",
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
      vendedor: "",
      pago: "",
      tipotarjeta: "",
      nombre_tarjetahabiente: "",
      banco: "",
      ultimos_4_digitos: "",
      tipo_identificacion: "",
      numero_identificacion: "",
      solicitud: "",
      enganche: "",
      financiera: "",
      financiamiento: "",
    },
  });

  // Auto-calculate Price Text and Formatted Currency
  const precioNumero = form.watch("precio_numero");

  useEffect(() => {
    if (precioNumero) {
      const amount = parseFloat(precioNumero);
      if (!isNaN(amount)) {
        const formatted = formatCurrency(amount);
        const words = numberToWordsMX(amount);

        // Use setValue with shouldValidate: true to ensure validation passes
        form.setValue("precio_total", formatted, { shouldValidate: true });
        form.setValue("precio_letras", words, { shouldValidate: true });
      }
    }
  }, [precioNumero, form]);

  const onSubmit = async (data: ContractFormValues) => {
    setIsLoading(true);

    try {
      // Dynamic import for document generation logic to reduce initial bundle size
      const { generateDocument } = await import("@/lib/document-generator");

      // Sanitize data: Replace undefined or null values with empty strings
      // to prevent "undefined" appearing in the document.
      const rawSanitizedData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, value ?? ""])
      );

      // Map fields to specific template keys required by the user
      const templateData = {
        ...rawSanitizedData,
        "régimen_fiscal": data.regimen_fiscal,
        "CFDI": data.uso_cfdi,
        "TID": data.tipo_identificacion,
        "No_ID": data.numero_identificacion,
        "n_solicitud": data.solicitud,
        "código_postal": data.codigo_postal,
        "año_modelo": data.año_modelo,
        "últimos_4_digitos": data.ultimos_4_digitos,
      };

      const templates = [
        { url: "/templates/contrato-profeco.docx", name: `Contrato-${data.nombre_comprador || "Cliente"}.docx` },
        { url: "/templates/carta-autorizacion.docx", name: `Autorizacion-${data.nombre_comprador || "Cliente"}.docx` },
        { url: "/templates/formato-venta.docx", name: `Venta-${data.nombre_comprador || "Cliente"}.docx` },
      ];

      await Promise.all(templates.map(t => generateDocument(t.url, templateData, t.name)));
    } catch (error: any) {
      console.error("Error generating documents:", error);
      alert(error.message || "Ocurrió un error al generar los documentos.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-5xl mx-auto shadow-lg border-muted/40">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Generar Documentación de Venta</CardTitle>
        <CardDescription>
          Completa la información para generar automáticamente los contratos y formatos necesarios.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

            {/* A. Información del Contrato */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-1 bg-primary rounded-full" />
                <h3 className="text-lg font-semibold tracking-tight">Información del Contrato</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-4 bg-muted/20 rounded-lg border">
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

            <Separator />

            {/* B. Datos del Comprador y Facturación */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-1 bg-primary rounded-full" />
                <h3 className="text-lg font-semibold tracking-tight">Datos del Comprador y Facturación</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="nombre_comprador"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo / Razón Social</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. Juan Pérez" {...field} />
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
                        <Input placeholder="AAAA000000XXX" className="uppercase" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="regimen_fiscal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Régimen Fiscal</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione Régimen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[300px]">
                          <SelectGroup>
                            <SelectLabel>Personas Físicas</SelectLabel>
                            {REGIMEN_FISCAL.fisicas.map((item) => (
                              <SelectItem key={item.value} value={item.label}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                          <Separator className="my-2" />
                          <SelectGroup>
                            <SelectLabel>Personas Morales</SelectLabel>
                            {REGIMEN_FISCAL.morales.map((item) => (
                              <SelectItem key={item.value} value={item.label}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                          <Separator className="my-2" />
                          <SelectGroup>
                            <SelectLabel>Extranjeros</SelectLabel>
                            {REGIMEN_FISCAL.extranjeros.map((item) => (
                              <SelectItem key={item.value} value={item.label}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="uso_cfdi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Uso de CFDI</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione Uso CFDI" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[300px]">
                           {USO_CFDI.map((item) => (
                              <SelectItem key={item.value} value={item.label}>
                                {item.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
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

            <Separator />

            {/* Dirección */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                 <div className="h-8 w-1 bg-primary rounded-full" />
                 <h3 className="text-lg font-semibold tracking-tight">Domicilio</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="calle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calle</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre de la calle" {...field} />
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

            <Separator />

            {/* C. Datos de la Motocicleta */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                 <div className="h-8 w-1 bg-primary rounded-full" />
                 <h3 className="text-lg font-semibold tracking-tight">Datos del Vehículo</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="submarca"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Submarca (Modelo)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. Sportster" {...field} />
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
                        <Input placeholder="Ej. S 1250" {...field} />
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
                        <Input placeholder="2024" {...field} />
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
                        <Input placeholder="Ej. Negro Mate" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* D. Detalles de Pago */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                 <div className="h-8 w-1 bg-primary rounded-full" />
                 <h3 className="text-lg font-semibold tracking-tight">Detalles de la Transacción</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted/20 rounded-lg border">
                <FormField
                  control={form.control}
                  name="precio_numero"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio Total (Numérico)</FormLabel>
                      <FormControl>
                        <Input placeholder="0.00" type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormDescription>
                        Ingrese el monto sin formato. Los demás campos se calcularán automáticamente.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="precio_total"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio Formateado</FormLabel>
                      <FormControl>
                        <Input placeholder="$0.00" {...field} />
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
                        <FormLabel>Importe con Letra</FormLabel>
                        <FormControl>
                          <Input placeholder="CERO PESOS 00/100 M.N." {...field} />
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
                      <FormLabel>Forma de Pago (Contrato)</FormLabel>
                      <FormControl>
                        <Input placeholder="Contado / Crédito" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

             {/* E. Datos del Vendedor y Operación */}
             <div className="space-y-4">
              <div className="flex items-center gap-2">
                 <div className="h-8 w-1 bg-primary rounded-full" />
                 <h3 className="text-lg font-semibold tracking-tight">Operación y Vendedor</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                  control={form.control}
                  name="vendedor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendedor</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del Vendedor" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pago"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto del Movimiento (Pago)</FormLabel>
                      <FormControl>
                        <Input placeholder="0.00" type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tipotarjeta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Método de Pago</FormLabel>
                       <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione una opción" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Tarjeta de Crédito">Tarjeta de Crédito</SelectItem>
                          <SelectItem value="Tarjeta de Débito">Tarjeta de Débito</SelectItem>
                          <SelectItem value="Transferencia">Transferencia</SelectItem>
                          <SelectItem value="Efectivo">Efectivo</SelectItem>
                          <SelectItem value="Cheque">Cheque</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nombre_tarjetahabiente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Tarjetahabiente</FormLabel>
                      <FormControl>
                        <Input placeholder="Como aparece en la tarjeta" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* F. Datos Bancarios y Identificación */}
             <div className="space-y-4">
              <div className="flex items-center gap-2">
                 <div className="h-8 w-1 bg-primary rounded-full" />
                 <h3 className="text-lg font-semibold tracking-tight">Identificación y Banco</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                  control={form.control}
                  name="banco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Banco</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del Banco" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ultimos_4_digitos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Últimos 4 dígitos</FormLabel>
                      <FormControl>
                        <Input placeholder="0000" maxLength={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tipo_identificacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Identificación (TID)</FormLabel>
                      <FormControl>
                        <Input placeholder="INE / Pasaporte" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numero_identificacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Identificación (No_ID)</FormLabel>
                      <FormControl>
                        <Input placeholder="Clave de Elector / Pasaporte" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* G. Datos Adicionales */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                 <div className="h-8 w-1 bg-primary rounded-full" />
                 <h3 className="text-lg font-semibold tracking-tight">Financiamiento (Opcional)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="solicitud"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Solicitud</FormLabel>
                      <FormControl>
                        <Input placeholder="Num Solicitud" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="enganche"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Enganche</FormLabel>
                      <FormControl>
                        <Input placeholder="Monto Enganche" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="financiera"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Financiera</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre Financiera" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="financiamiento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo Financiamiento</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. Crédito Directo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {isLoading ? "Generando Documentos..." : "Generar Documentación Completa"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
