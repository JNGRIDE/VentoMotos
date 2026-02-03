"use client";

import { useState } from "react";
import { FilePenLine, LoaderCircle } from "lucide-react";
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
import { updateMotorcycle } from "@/firebase/db";
import type { Motorcycle, NewMotorcycle } from "@/lib/data";

interface EditMotorcycleDialogProps {
  motorcycle: Motorcycle;
  onMotorcycleUpdated: () => void;
}

export function EditMotorcycleDialog({ motorcycle, onMotorcycleUpdated }: EditMotorcycleDialogProps) {
  const db = useFirestore();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const updatedData: Partial<NewMotorcycle> = {
      model: String(formData.get("model")),
      sku: String(formData.get("sku")),
      stock: Number(formData.get("stock")),
    };

    try {
      await updateMotorcycle(db, motorcycle.id, updatedData);
      toast({
        title: "Motorcycle Updated!",
        description: `${updatedData.model} has been updated in the inventory.`,
      });
      onMotorcycleUpdated();
      setOpen(false);
    } catch (error: any) {
      console.error("Failed to update motorcycle:", error);
      toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: error.message || "An unexpected error occurred.",
      });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
            <FilePenLine className="h-4 w-4" />
            <span className="sr-only">Edit Motorcycle</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-headline">Edit Motorcycle</DialogTitle>
            <DialogDescription>
              Make changes to this motorcycle. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="model" className="text-right">
                Model
              </Label>
              <Input id="model" name="model" defaultValue={motorcycle.model} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sku" className="text-right">
                SKU
              </Label>
              <Input id="sku" name="sku" defaultValue={motorcycle.sku} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stock" className="text-right">
                Stock
              </Label>
              <Input id="stock" name="stock" type="number" defaultValue={motorcycle.stock} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
