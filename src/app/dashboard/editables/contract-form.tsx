"use client";

import { useState } from "react";
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
} from "@/components/ui/select";
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
        // Ensure specific casing if templates rely on it, though standardizing on the schema keys is best if templates match.
        // User provided specific placeholders like {régimen_fiscal}, {CFDI}, {TID}, {No_ID}.
        // The rest match the schema keys or are simple variants.
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
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Generar Documentación de Venta</CardTitle>
        <CardDescription>
          Llena el formulario para generar los 3 documentos: Contrato PROFECO, Carta de Autorización y Formato de Venta.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* A. Información del Contrato */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Información del Contrato</h3>
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

            {/* B. Datos del Comprador y Facturación */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Datos del Comprador y Facturación</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nombre_comprador"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo / Razón Social</FormLabel>
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
                  name="regimen_fiscal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Régimen Fiscal</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione Régimen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="601 General de Ley Personas Morales">601 General de Ley Personas Morales</SelectItem>
                          <SelectItem value="605 Sueldos y Salarios">605 Sueldos y Salarios</SelectItem>
                          <SelectItem value="612 Personas Físicas con Actividades Empresariales">612 Personas Físicas con Actividades Empresariales</SelectItem>
                          <SelectItem value="621 Incorporación Fiscal">621 Incorporación Fiscal</SelectItem>
                          <SelectItem value="626 Régimen Simplificado de Confianza">626 Régimen Simplificado de Confianza</SelectItem>
                          <SelectItem value="606 Arrendamiento">606 Arrendamiento</SelectItem>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione Uso CFDI" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="G01 Adquisición de mercancías">G01 Adquisición de mercancías</SelectItem>
                          <SelectItem value="G03 Gastos en general">G03 Gastos en general</SelectItem>
                          <SelectItem value="I01 Construcciones">I01 Construcciones</SelectItem>
                          <SelectItem value="P01 Por definir">P01 Por definir</SelectItem>
                          <SelectItem value="D01 Honorarios médicos">D01 Honorarios médicos</SelectItem>
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

            {/* Dirección */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Dirección</h3>
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

            {/* C. Datos de la Motocicleta */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Datos de la Motocicleta</h3>
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

            {/* D. Detalles de Pago */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Detalles de Pago</h3>
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
              <h3 className="text-lg font-medium border-b pb-2">Datos del Vendedor y Operación</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <Input placeholder="Monto" type="number" {...field} />
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
                      <FormLabel>Tipo de Tarjeta / Forma de Pago</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <Input placeholder="Nombre en la tarjeta" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* F. Datos Bancarios y Identificación */}
             <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Datos Bancarios y de Identificación</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <Input placeholder="Clave de Elector / Num Pasaporte" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* G. Datos Adicionales */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Datos Adicionales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Generando 3 Documentos..." : "Generar Documentos"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
