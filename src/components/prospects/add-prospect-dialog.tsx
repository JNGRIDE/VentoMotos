"use client";

import { useState, useEffect } from "react";
import { PlusCircle, LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { addProspect, getUserProfiles } from "@/firebase/services";
import type { NewProspect, UserProfile } from "@/lib/data";

const addProspectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  source: z.enum(["Organic", "Advertising"]),
  salespersonId: z.string().min(1, "Salesperson is required"),
});

type AddProspectFormValues = z.infer<typeof addProspectSchema>;

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

  const form = useForm<AddProspectFormValues>({
    resolver: zodResolver(addProspectSchema),
    defaultValues: {
      name: "",
      source: "Organic",
      salespersonId: currentUserProfile.uid,
    },
  });

  useEffect(() => {
    if (open) {
        form.reset({
             name: "",
             source: "Organic",
             salespersonId: currentUserProfile.uid,
        });

        if (currentUserProfile.role === 'Manager') {
            getUserProfiles(db).then(setUserProfiles);
        }
    }
  }, [open, db, currentUserProfile, form]);

  const handleSubmit = async (data: AddProspectFormValues) => {
    setIsSaving(true);
    
    const newProspect: NewProspect = {
      name: data.name,
      sprint,
      source: data.source,
      salespersonId: data.salespersonId,
      stage: "Potential",
      lastContact: new Date().toISOString(),
    };

    try {
      await addProspect(db, newProspect);
      toast({
        title: "Prospect Added!",
        description: `${data.name} has been added to the funnel.`,
      });
      onProspectAdded();
      setOpen(false);
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
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogHeader>
                <DialogTitle className="font-headline">Add New Prospect</DialogTitle>
                <DialogDescription>
                Enter the details for the new lead. It will be added to the current sprint.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                            <FormLabel className="text-right">Name</FormLabel>
                            <div className="col-span-3">
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </div>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                            <FormLabel className="text-right">Source</FormLabel>
                            <div className="col-span-3">
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Organic">Organic</SelectItem>
                                        <SelectItem value="Advertising">Advertising</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </div>
                        </FormItem>
                    )}
                />

                {isManager && (
                   <FormField
                        control={form.control}
                        name="salespersonId"
                        render={({ field }) => (
                            <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                                <FormLabel className="text-right">Assign to</FormLabel>
                                <div className="col-span-3">
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {userProfiles.map(p => <SelectItem key={p.uid} value={p.uid}>{p.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </div>
                            </FormItem>
                        )}
                    />
                )}
            </div>
            <DialogFooter>
                <Button type="submit" disabled={isSaving}>
                {isSaving && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Save Prospect
                </Button>
            </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
