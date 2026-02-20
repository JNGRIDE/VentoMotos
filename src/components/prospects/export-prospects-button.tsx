"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { saveAs } from "file-saver";
import { type Prospect } from "@/lib/data";

interface ExportProspectsButtonProps {
    prospects: Prospect[];
}

export function ExportProspectsButton({ prospects }: ExportProspectsButtonProps) {
    const handleExport = () => {
        // CSV Header
        const header = ["Name", "Email"];

        // CSV Rows
        const rows = prospects.map(p => {
            // Escape double quotes by doubling them
            const name = p.name ? `"${p.name.replace(/"/g, '""')}"` : "";
            const email = p.email ? `"${p.email.replace(/"/g, '""')}"` : "";
            return [name, email].join(",");
        });

        const csvContent = [header.join(","), ...rows].join("\n");
        // Add BOM for Excel compatibility
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8" });
        saveAs(blob, "prospects.csv");
    };

    return (
        <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={handleExport}
            disabled={!prospects || prospects.length === 0}
        >
            <Download className="mr-2 h-4 w-4" />
            Export
        </Button>
    );
}
