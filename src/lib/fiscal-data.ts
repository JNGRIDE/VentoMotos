// src/lib/fiscal-data.ts

export const USO_CFDI = [
  { value: "G01", label: "G01 - Adquisición de mercancías" },
  { value: "G02", label: "G02 - Devoluciones, descuentos o bonificaciones" },
  { value: "G03", label: "G03 - Gastos en general" },
  { value: "I01", label: "I01 - Construcciones" },
  { value: "I02", label: "I02 - Mobiliario y equipo de oficina por inversiones" },
  { value: "I03", label: "I03 - Equipo de transporte" },
  { value: "I04", label: "I04 - Equipo de computo y accesorios" },
  { value: "I05", label: "I05 - Dados, troqueles, moldes, matrices y herramental" },
  { value: "I06", label: "I06 - Comunicaciones telefónicas" },
  { value: "I07", label: "I07 - Comunicaciones satelitales" },
  { value: "I08", label: "I08 - Otra maquinaria y equipo" },
  { value: "S01", label: "S01 - Sin efectos fiscales" },
] as const;

export const REGIMEN_FISCAL = {
  fisicas: [
    { value: "605", label: "605 - Sueldos y Salarios e Ingresos Asimilados a Salarios" },
    { value: "606", label: "606 - Arrendamiento" },
    { value: "608", label: "608 - Demás ingresos" },
    { value: "611", label: "611 - Ingresos por Dividendos (socios y accionistas)" },
    { value: "612", label: "612 - Personas Físicas con Actividades Empresariales y Profesionales" },
    { value: "614", label: "614 - Ingresos por intereses" },
    { value: "615", label: "615 - Régimen de los ingresos por obtención de premios" },
    { value: "616", label: "616 - Sin obligaciones fiscales" },
    { value: "621", label: "621 - Incorporación Fiscal" },
    { value: "622", label: "622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras" },
    { value: "629", label: "629 - De los Regímenes Fiscales Preferentes y de las Empresas Multinacionales" },
    { value: "630", label: "630 - Enajenación de acciones en bolsa de valores" },
  ],
  morales: [
    { value: "601", label: "601 - General de Ley Personas Morales" },
    { value: "603", label: "603 - Personas Morales con Fines no Lucrativos" },
    { value: "607", label: "607 - Régimen de Enajenación o Adquisición de Bienes" },
    { value: "609", label: "609 - Consolidación" },
    { value: "620", label: "620 - Sociedades Cooperativas de Producción que optan por diferir sus ingresos" },
    { value: "622", label: "622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras" },
    { value: "623", label: "623 - Opcional para Grupos de Sociedades" },
    { value: "624", label: "624 - Coordinados" },
    { value: "628", label: "628 - Hidrocarburos" },
  ],
  extranjeros: [
    { value: "610", label: "610 - Residentes en el Extranjero sin Establecimiento Permanente en México" },
  ],
} as const;

// Flattened list if needed for searches or simple listing
export const ALL_REGIMEN_FISCAL = [
  ...REGIMEN_FISCAL.fisicas,
  ...REGIMEN_FISCAL.morales,
  ...REGIMEN_FISCAL.extranjeros,
];
