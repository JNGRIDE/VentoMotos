"use client";

import { useState } from "react";
import { Upload, LoaderCircle, FileCheck2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { processInventory, ProcessInventoryOutput } from "@/ai/flows/process-inventory-flow";
import { addMotorcyclesBatch } from "@/firebase/db";
import type { NewMotorcycle } from "@/lib/data";


interface UploadInventoryDialogProps {
  onInventoryUpdated: () => void;
}

export function UploadInventoryDialog({ onInventoryUpdated }: UploadInventoryDialogProps) {
  const db = useFirestore();
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      toast({ variant: "destructive", title: "No file selected", description: "Please select a PDF file to upload." });
      return;
    }
    
    setIsProcessing(true);

    try {
      const pdfDataUri = await fileToDataUri(selectedFile);
      const extractedItems: ProcessInventoryOutput = await processInventory({ pdfDataUri });

      if (!extractedItems || extractedItems.length === 0) {
        throw new Error("The AI could not extract any motorcycle data from the document.");
      }

      // Aggregate the extracted items
      const aggregated = new Map<string, { model: string; stock: number; skus: string[] }>();
      for (const item of extractedItems) {
        const existing = aggregated.get(item.model);
        if (existing) {
          existing.stock += item.stock;
          existing.skus.push(item.sku);
        } else {
          aggregated.set(item.model, {
            model: item.model,
            stock: item.stock,
            skus: [item.sku],
          });
        }
      }

      const motorcyclesToUpload: NewMotorcycle[] = Array.from(aggregated.values());

      await addMotorcyclesBatch(db, motorcyclesToUpload);

      toast({
        title: "Inventory Uploaded!",
        description: `${motorcyclesToUpload.length} models have been added or updated in the inventory.`,
      });

      onInventoryUpdated();
      setOpen(false);
      setSelectedFile(null);
    } catch (error: any) {
      console.error("Failed to process or upload inventory:", error);
      toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: error.message || "Failed to process the PDF file.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1">
          <Upload className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Upload Inventory
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-headline">Upload Inventory PDF</DialogTitle>
            <DialogDescription>
              Select a PDF file with the inventory list. The AI will read it and add the items automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="pdf-file">PDF Document</Label>
                <div className="flex space-x-2">
                    <Input id="pdf-file" type="file" accept="application/pdf" onChange={handleFileChange} />
                </div>
                {selectedFile && (
                    <div className="flex items-center text-sm text-muted-foreground pt-2">
                        <FileCheck2 className="h-4 w-4 mr-2 text-green-500" />
                        <span>{selectedFile.name}</span>
                    </div>
                )}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isProcessing || !selectedFile}>
              {isProcessing ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Process File
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}