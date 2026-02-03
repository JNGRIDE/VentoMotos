"use client";

import { useState } from "react";
import { PackagePlus, LoaderCircle } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { addMotorcycle } from "@/firebase/services";
import type { NewMotorcycle } from "@/lib/data";

interface AddMotorcycleDialogProps {
  onMotorcycleAdded: () => void;
}

export function AddMotorcycleDialog({ onMotorcycleAdded }: AddMotorcycleDialogProps) {
  const db = useFirestore();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const model = String(formData.get("model"));
    const skus = String(formData.get("skus"))
      .split('\n')
      .map(s => s.trim())
      .filter(s => s);

    if (!model || skus.length === 0) {
        toast({
            variant: "destructive",
            title: "Invalid data",
            description: "Please provide a model name and at least one SKU.",
        });
        setIsSaving(false);
        return;
    }
    
    const newMotorcycle: NewMotorcycle = {
      model,
      skus,
      stock: skus.length,
    };

    try {
      await addMotorcycle(db, newMotorcycle);
      toast({
        title: "Motorcycle Added!",
        description: `${newMotorcycle.model} has been added to the inventory.`,
      });
      onMotorcycleAdded(); // Refresh the list
      setOpen(false);
      event.currentTarget.reset();
    } catch (error: any) {
      console.error("Failed to add motorcycle:", error);
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
        <Button size="sm" className="h-8 gap-1">
          <PackagePlus className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Add Motorcycle
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-headline">Add New Motorcycle</DialogTitle>
            <DialogDescription>
              Add a new model to the inventory. The stock will be calculated based on the number of SKUs entered.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="model" className="text-right">
                Model
              </Label>
              <Input id="model" name="model" placeholder="Vento Xplor 250" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="skus" className="text-right pt-2">
                SKUs
              </Label>
              <div className="col-span-3">
                <Textarea id="skus" name="skus" placeholder="VN-XPLR-250-BLK-001&#10;VN-XPLR-250-BLK-002&#10;VN-XPLR-250-BLK-003" rows={5} />
                <p className="text-xs text-muted-foreground mt-1">Enter one SKU per line.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
