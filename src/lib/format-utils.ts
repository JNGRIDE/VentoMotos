export function formatCurrency(amount: number | string): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(value)) return "";

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function getUnidades(num: number): string {
  switch (num) {
    case 1: return "UN ";
    case 2: return "DOS ";
    case 3: return "TRES ";
    case 4: return "CUATRO ";
    case 5: return "CINCO ";
    case 6: return "SEIS ";
    case 7: return "SIETE ";
    case 8: return "OCHO ";
    case 9: return "NUEVE ";
  }
  return "";
}

function getDecenas(num: number): string {
  const decena = Math.floor(num / 10);
  const unidad = num - decena * 10;

  switch (decena) {
    case 1:
      switch (unidad) {
        case 0: return "DIEZ ";
        case 1: return "ONCE ";
        case 2: return "DOCE ";
        case 3: return "TRECE ";
        case 4: return "CATORCE ";
        case 5: return "QUINCE ";
        default: return "DIECI" + getUnidades(unidad);
      }
    case 2:
      if (unidad === 0) return "VEINTE ";
      return "VEINTI" + getUnidades(unidad);
    case 3: return "TREINTA " + (unidad > 0 ? "Y " + getUnidades(unidad) : "");
    case 4: return "CUARENTA " + (unidad > 0 ? "Y " + getUnidades(unidad) : "");
    case 5: return "CINCUENTA " + (unidad > 0 ? "Y " + getUnidades(unidad) : "");
    case 6: return "SESENTA " + (unidad > 0 ? "Y " + getUnidades(unidad) : "");
    case 7: return "SETENTA " + (unidad > 0 ? "Y " + getUnidades(unidad) : "");
    case 8: return "OCHENTA " + (unidad > 0 ? "Y " + getUnidades(unidad) : "");
    case 9: return "NOVENTA " + (unidad > 0 ? "Y " + getUnidades(unidad) : "");
  }
  return getUnidades(unidad);
}

function getCentenas(num: number): string {
  const centenas = Math.floor(num / 100);
  const decenas = num - centenas * 100;

  switch (centenas) {
    case 1:
      if (decenas > 0) return "CIENTO " + getDecenas(decenas);
      return "CIEN ";
    case 2: return "DOSCIENTOS " + getDecenas(decenas);
    case 3: return "TRESCIENTOS " + getDecenas(decenas);
    case 4: return "CUATROCIENTOS " + getDecenas(decenas);
    case 5: return "QUINIENTOS " + getDecenas(decenas);
    case 6: return "SEISCIENTOS " + getDecenas(decenas);
    case 7: return "SETECIENTOS " + getDecenas(decenas);
    case 8: return "OCHOCIENTOS " + getDecenas(decenas);
    case 9: return "NOVECIENTOS " + getDecenas(decenas);
  }
  return getDecenas(decenas);
}

function getMiles(num: number): string {
  const divisor = 1000;
  const miles = Math.floor(num / divisor);
  const resto = num - miles * divisor;

  let strMiles = "";
  if (miles > 0) {
    if (miles === 1) {
      strMiles = "MIL ";
    } else {
      strMiles = getCentenas(miles) + "MIL ";
    }
  }

  if (resto > 0) {
    return strMiles + getCentenas(resto);
  }
  return strMiles;
}

function getMillones(num: number): string {
  const divisor = 1000000;
  const millones = Math.floor(num / divisor);
  const resto = num - millones * divisor;

  let strMillones = "";
  if (millones > 0) {
    if (millones === 1) {
      strMillones = "UN MILLON ";
    } else {
      strMillones = getCentenas(millones) + "MILLONES "; // Basic implementation, might need refinement for "21 millones" -> "veintiún"
      // Fix for "veintiun" case in millions if needed, but "veintiun" logic is inside getDecenas as "VEINTI"+getUnidades(1) -> "VEINTIUN"
      // However, typically "VEINTIÚN MILLONES" needs the accent/change.
      // For simplicity in this context, "VEINTIUN MILLONES" is acceptable in most contracts or usually corrected manually if needed,
      // but let's try to be precise.
      // Standard "VEINTIUN" is fine.
    }
  }

  if (resto > 0) {
    return strMillones + getMiles(resto);
  }
  return strMillones;
}

export function numberToWordsMX(amount: number | string): string {
  let value = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(value)) return "";

  // Fix floating point issues
  value = parseFloat(value.toFixed(2));

  const enteros = Math.floor(value);
  const centavos = Math.round((value - enteros) * 100);

  let letras = "";
  if (enteros === 0) {
    letras = "CERO ";
  } else if (enteros === 1) {
    letras = "UN "; // "UN PESO"
  } else if (enteros < 1000000) {
    letras = getMiles(enteros);
  } else {
    letras = getMillones(enteros);
  }

  // Formatting for currency
  // Remove trailing spaces
  letras = letras.trim();

  let moneda = enteros === 1 ? " PESO" : " PESOS";
  if (letras.endsWith("MILLON") || letras.endsWith("MILLONES")) {
    moneda = " DE" + moneda;
  }

  const centavosStr = centavos.toString().padStart(2, "0");

  return `${letras}${moneda} ${centavosStr}/100 M.N.`;
}
