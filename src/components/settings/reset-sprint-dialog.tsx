"use client";

import { useState } from "react";
import { Trash, LoaderCircle } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { resetSprintData } from "@/firebase/services/sales";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ResetSprintDialogProps {
  sprint: string;
  onSprintReset: () => void;
}

export function ResetSprintDialog({ sprint, onSprintReset }: ResetSprintDialogProps) {
  const db = useFirestore();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const { toast } = useToast();
  
  if (!sprint) return null;

  const sprintDate = new Date(`${sprint}-02`); // Use day 2 to avoid timezone issues with day 1
  const formattedSprint = format(sprintDate, "MMMM yyyy", { locale: es });
  const confirmationPhrase = `borrar ${formattedSprint}`;

  const handleDelete = async () => {
    if (confirmationText !== confirmationPhrase) {
      toast({
        variant: "destructive",
        title: "Confirmación incorrecta",
        description: `Debes escribir exactamente "${confirmationPhrase}" para confirmar.`,
      });
      return;
    }

    setIsDeleting(true);
    try {
      await resetSprintData(db, sprint);
      toast({
        title: "Sprint Reiniciado",
        description: `Todos los datos de ventas y prospectos para ${formattedSprint} han sido borrados.`,
      });
      onSprintReset();
      setOpen(false);
    } catch (error: any) {
      console.error("Failed to reset sprint:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message || "No se pudieron borrar los datos del sprint.",
      });
    } finally {
      setIsDeleting(false);
      setConfirmationText("");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
            <Trash className="mr-2 h-4 w-4" />
            Reiniciar Sprint Actual
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción es irreversible. Se borrarán TODAS las ventas y prospectos del sprint de{' '}
            <span className="font-bold text-destructive">{formattedSprint}</span>.
            También se reiniciarán las metas de todos los vendedores a cero.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-2">
            <Label htmlFor="confirmation">
                Para confirmar, escribe: <span className="font-semibold text-foreground">{confirmationPhrase}</span>
            </Label>
            <Input 
                id="confirmation"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                className="mt-2"
                placeholder={confirmationPhrase}
            />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmationText("")}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting || confirmationText !== confirmationPhrase}>
            {isDeleting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar y Borrar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
