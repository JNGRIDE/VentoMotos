"use client";

import { useState } from "react";
import { Trash2, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { deleteMotorcycle } from "@/firebase/services";

interface DeleteMotorcycleDialogProps {
  motorcycleId: string;
  motorcycleModel: string;
  onMotorcycleDeleted: () => void;
}

export function DeleteMotorcycleDialog({ motorcycleId, motorcycleModel, onMotorcycleDeleted }: DeleteMotorcycleDialogProps) {
  const db = useFirestore();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteMotorcycle(db, motorcycleId);
      toast({
        title: "Motorcycle Deleted",
        description: `"${motorcycleModel}" has been removed from the inventory.`,
      });
      onMotorcycleDeleted();
      setOpen(false);
    } catch (error: unknown) {
      console.error("Failed to delete motorcycle:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: errorMessage,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Trash2 className="h-4 w-4 text-destructive" />
          <span className="sr-only">Delete Motorcycle</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the motorcycle
            "{motorcycleModel}" from the inventory.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
            {isDeleting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
