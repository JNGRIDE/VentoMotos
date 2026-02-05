import type { Sale } from "./data";
import { format } from "date-fns";

export function exportSalesToCSV(sales: Sale[], filename: string = "sales-report") {
  if (!sales || sales.length === 0) {
    return;
  }

  // Define headers
  const headers = [
    "Date",
    "Sprint",
    "Salesperson ID",
    "Prospect Name",
    "Motorcycle Model",
    "Amount",
    "Payment Method",
    "Credit Provider",
    "SKU",
    "Notes"
  ];

  // Map data to rows
  const rows = sales.map(sale => [
    format(new Date(sale.date), "yyyy-MM-dd HH:mm"),
    sale.sprint,
    sale.salespersonId,
    `"${sale.prospectName.replace(/"/g, '""')}"`, // Escape quotes
    `"${sale.motorcycleModel.replace(/"/g, '""')}"`,
    sale.amount,
    sale.paymentMethod,
    sale.creditProvider || "",
    sale.soldSku || "",
    `"${(sale.notes || "").replace(/"/g, '""')}"`
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.join(","))
  ].join("\n");

  // Create a blob and trigger download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}-${format(new Date(), "yyyyMMdd-HHmm")}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
