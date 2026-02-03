"use client";

import { useState, useEffect } from "react";
import { PlusCircle, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { addProspect, getUserProfiles } from "@/firebase/services";
import type { NewProspect, UserProfile } from "@/lib/data";

interface AddProspectDialogProps {
  sprint: string;
  currentUserProfile: UserProfile;
  onProspectAdded: () => void;
}

export function AddProspectDialog({ sprint, currentUserProfile, onProspectAdded }: AddProspectDialogProps) {
  const db = useFirestore();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [source, setSource] = useState<"Organic" | "Advertising">("Organic");
  const [salespersonId, setSalespersonId] = useState(currentUserProfile.uid);

  useEffect(() => {
    if (open && currentUserProfile.role === 'Manager') {
      getUserProfiles(db).then(setUserProfiles);
    }
  }, [open, db, currentUserProfile.role]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name) {
      toast({ variant: "destructive", title: "Name is required" });
      return;
    }
    setIsSaving(true);
    
    const newProspect: NewProspect = {
      name,
      sprint,
      source,
      salespersonId,
      stage: "Potential",
      lastContact: new Date().toISOString(),
    };

    try {
      await addProspect(db, newProspect);
      toast({
        title: "Prospect Added!",
        description: `${name} has been added to the funnel.`,
      });
      onProspectAdded();
      setOpen(false);
      // reset form
      setName("");
      setSource("Organic");
      setSalespersonId(currentUserProfile.uid);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const isManager = currentUserProfile.role === 'Manager';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Add Prospect
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-headline">Add New Prospect</DialogTitle>
            <DialogDescription>
              Enter the details for the new lead. It will be added to the current sprint.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="source" className="text-right">Source</Label>
              <Select value={source} onValueChange={(v) => setSource(v as any)}>
                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Organic">Organic</SelectItem>
                  <SelectItem value="Advertising">Advertising</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isManager && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="salesperson" className="text-right">Assign to</Label>
                <Select value={salespersonId} onValueChange={setSalespersonId}>
                  <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {userProfiles.map(p => <SelectItem key={p.uid} value={p.uid}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              Save Prospect
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
