import { z } from "zod";

export const contractSchema = z.object({
  // A. Información del Contrato
  dia: z.string().min(1, "El día es requerido"),
  mes: z.string().min(1, "El mes es requerido"),
  año: z.string().min(4, "El año debe tener 4 dígitos"),

  // B. Datos del Comprador
  nombre_comprador: z.string().min(1, "El nombre completo es requerido"),
  rfc: z.string().min(10, "El RFC debe ser válido").optional().or(z.literal("")),
  email: z.string().email("Correo electrónico inválido"),
  celular: z.string().min(10, "El número de celular debe tener 10 dígitos"),

  // Dirección
  calle: z.string().min(1, "La calle es requerida"),
  numero_ext: z.string().min(1, "El número exterior es requerido"),
  colonia: z.string().min(1, "La colonia es requerida"),
  delegacion: z.string().min(1, "La delegación/municipio es requerida"),
  estado: z.string().min(1, "El estado es requerido"),
  codigo_postal: z.string().length(5, "El código postal debe tener 5 dígitos"),

  // C. Datos de la Motocicleta
  submarca: z.string().min(1, "La submarca (modelo) es requerida"),
  version: z.string().min(1, "El tipo o versión es requerido"),
  año_modelo: z.string().min(4, "El año-modelo debe tener 4 dígitos"),
  color: z.string().min(1, "El color es requerido"),

  // D. Detalles de Pago
  precio_numero: z.string().min(1, "El precio total (número) es requerido"),
  precio_letras: z.string().min(1, "El precio total (letra) es requerido"),
  precio_total: z.string().min(1, "El precio total (formato carátula) es requerido"),
  forma_de_pago: z.string().min(1, "La forma de pago es requerida"),
});

export type ContractFormValues = z.infer<typeof contractSchema>;
