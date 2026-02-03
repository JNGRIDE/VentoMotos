"use client";

import { useState, useEffect } from "react";
import { PlusCircle, LoaderCircle } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { getUserProfiles } from "@/firebase/db";
import type { NewSale, UserProfile } from "@/lib/data";

interface RecordSaleDialogProps {
  onAddSale: (sale: NewSale) => Promise<void>;
  currentUserProfile: UserProfile;
}

export function RecordSaleDialog({ onAddSale, currentUserProfile }: RecordSaleDialogProps) {
  const db = useFirestore();
  const [open, setOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      getUserProfiles(db).then(data => {
        setUserProfiles(data);
        setIsLoading(false);
      });
    }
  }, [db, open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newSale: NewSale = {
      salespersonId: String(formData.get("salesperson-id")),
      prospectName: String(formData.get("prospect-name")),
      motorcycleModel: String(formData.get("motorcycle-model")),
      amount: Number(formData.get("amount")),
      paymentMethod: formData.get("payment-method") as "Cash" | "Financing",
      creditProvider: formData.get("credit-provider") as "Vento" | "Other" | undefined,
    };

    if (!newSale.salespersonId || !newSale.prospectName || !newSale.amount || !newSale.paymentMethod || !newSale.motorcycleModel) {
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "Please fill out all required fields.",
        });
        return;
    }

    try {
      await onAddSale(newSale);
      
      toast({
        title: "Sale Recorded!",
        description: "The new sale has been successfully added to the system.",
      });
      setOpen(false);
      setPaymentMethod("");
      event.currentTarget.reset();
    } catch (error) {
      // Error is handled by the caller
    }
  };

  const isManager = currentUserProfile.role === 'Manager';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Record Sale
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-headline">Record New Sale</DialogTitle>
            <DialogDescription>
              Fill in the details of the new sale. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="salesperson-id" className="text-right">
                Salesperson
              </Label>
              {isManager ? (
                 <Select name="salesperson-id">
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder={isLoading ? "Loading..." : "Select salesperson"} />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoading ? (
                        <div className="flex items-center justify-center p-4">
                          <LoaderCircle className="h-5 w-5 animate-spin" />
                        </div>
                      ) : (
                        userProfiles.map((sp) => (
                          <SelectItem key={sp.uid} value={sp.uid}>
                            {sp.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
              ) : (
                <Input id="salesperson-id" name="salesperson-id" type="hidden" value={currentUserProfile.uid} />
              )}
             
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="prospect-name" className="text-right">
                    Prospect
                </Label>
                <Input id="prospect-name" name="prospect-name" placeholder="John Doe" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="motorcycle-model" className="text-right">
                Model
              </Label>
              <Input id="motorcycle-model" name="motorcycle-model" placeholder="Vento Xplor 250" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input id="amount" name="amount" type="number" placeholder="35000" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="payment-method" className="text-right">
                Payment
              </Label>
              <Select name="payment-method" onValueChange={setPaymentMethod}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Financing">Financing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {paymentMethod === "Financing" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="credit-provider" className="text-right">
                  Credit
                </Label>
                <Select name="credit-provider">
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vento">Vento Crédito</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit">Save Sale</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}