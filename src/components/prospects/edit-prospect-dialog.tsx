"use client";

import { useState, useEffect } from "react";
import { LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { updateProspect, getUserProfiles } from "@/firebase/services";
import type { Prospect, UserProfile } from "@/lib/data";

const prospectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  source: z.enum(["Organic", "Advertising"]),
  salespersonId: z.string().min(1, "Salesperson is required"),
  stage: z.enum(["Potential", "Appointment", "Credit", "Closed"]),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  rfc: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  occupation: z.string().optional(),
  motorcycleInterest: z.string().optional(),
});

type ProspectFormValues = z.infer<typeof prospectSchema>;

interface EditProspectDialogProps {
  prospect: Prospect;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProspectUpdated: () => void;
  currentUserProfile: UserProfile | null;
}

export function EditProspectDialog({ prospect, open, onOpenChange, onProspectUpdated, currentUserProfile }: EditProspectDialogProps) {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);

  const form = useForm<ProspectFormValues>({
    resolver: zodResolver(prospectSchema),
    defaultValues: {
      name: prospect.name,
      source: prospect.source,
      salespersonId: prospect.salespersonId,
      stage: prospect.stage,
      phone: prospect.phone || "",
      email: prospect.email || "",
      rfc: prospect.rfc || "",
      address: prospect.address || "",
      notes: "",
      occupation: prospect.occupation || "",
      motorcycleInterest: prospect.motorcycleInterest || "",
    },
  });

  useEffect(() => {
    if (open) {
        // Reset form to current prospect values when dialog opens
        form.reset({
            name: prospect.name,
            source: prospect.source,
            salespersonId: prospect.salespersonId,
            stage: prospect.stage,
            phone: prospect.phone || "",
            email: prospect.email || "",
            rfc: prospect.rfc || "",
            address: prospect.address || "",
            notes: "", // Reset to empty to allow adding new note
            occupation: prospect.occupation || "",
            motorcycleInterest: prospect.motorcycleInterest || "",
        });

        if (currentUserProfile?.role === 'Manager') {
            getUserProfiles(db).then(setUserProfiles);
        }
    }
  }, [open, db, currentUserProfile, form, prospect]); // prospect in dep array is fine now that parent doesn't unmount

  const onSubmit = async (data: ProspectFormValues) => {
    setIsSaving(true);
    try {
      const updates: Partial<Prospect> = { ...data };

      // Update stageUpdatedAt if stage changed
      if (data.stage !== prospect.stage) {
          updates.stageUpdatedAt = new Date().toISOString();
      }

      // Handle notes and migration
      let currentNotesList = prospect.notesList || [];

      // Migration: If we have a legacy note but no list, move it to list before adding new one
      if (prospect.notes && currentNotesList.length === 0) {
           currentNotesList = [{
              content: prospect.notes,
              date: prospect.lastContact || new Date().toISOString(),
              author: "Legacy Note",
           }];
      }

      if (data.notes && data.notes.trim().length > 0) {
          const newNoteObj = {
              content: data.notes,
              date: new Date().toISOString(),
              author: currentUserProfile?.name || "Unknown",
          };
          updates.notesList = [...currentNotesList, newNoteObj];
      } else {
          // Don't overwrite existing notes field with empty string
          delete updates.notes;
          // If we didn't add a new note, but we performed a migration in memory,
          // we might want to save it if we were doing a rigorous migration,
          // but for now let's only save if other things changed or if we want to enforce migration.
          // To be safe and simple: only update notesList if we added a new note.
          // If we didn't add a new note, we don't save the migrated list,
          // so the UI will continue to show the "Legacy Note" from prospect.notes (via the check in render).
      }

      await updateProspect(db, prospect.id, updates);
      toast({
        title: "Prospect Updated",
        description: "The prospect details have been saved.",
      });
      // Close dialog FIRST to avoid race conditions with refresh
      onOpenChange(false);
      // THEN trigger refresh
      onProspectUpdated();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update prospect.";
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isManager = currentUserProfile?.role === 'Manager';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Prospect</DialogTitle>
          <DialogDescription>
            Update the details for this lead.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name *</FormLabel>
                            <FormControl>
                                <Input {...field} autoComplete="name" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                                <Input {...field} type="tel" autoComplete="tel" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input {...field} type="email" autoComplete="email" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="rfc"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>RFC</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                                <Textarea {...field} autoComplete="street-address" className="min-h-[60px]" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="occupation"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Occupation</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="Employee, Business Owner..." />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="motorcycleInterest"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Interest</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="Rocketman 250..." />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="space-y-2">
                    <FormLabel>Notes History</FormLabel>
                    <div className="bg-muted/50 rounded-md p-3 max-h-[150px] overflow-y-auto text-sm space-y-2">
                        {(!prospect.notesList || prospect.notesList.length === 0) && !prospect.notes && (
                            <p className="text-muted-foreground italic">No notes yet.</p>
                        )}
                         {/* Show legacy note if it exists and not in list (simplistic check) */}
                        {prospect.notes && (!prospect.notesList || prospect.notesList.length === 0) && (
                            <div className="bg-background p-2 rounded border">
                                <p>{prospect.notes}</p>
                                <p className="text-xs text-muted-foreground mt-1 text-right">Legacy Note</p>
                            </div>
                        )}
                        {prospect.notesList?.map((note, i) => (
                            <div key={i} className="bg-background p-2 rounded border">
                                <p>{note.content}</p>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-xs text-muted-foreground font-medium">{note.author}</span>
                                    <span className="text-xs text-muted-foreground">{new Date(note.date).toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                 <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Add New Note</FormLabel>
                            <FormControl>
                                <Textarea {...field} className="min-h-[60px]" placeholder="Type a new note here..." />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Source</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select source" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Organic">Organic</SelectItem>
                                    <SelectItem value="Advertising">Advertising</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="stage"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Stage</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select stage" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Potential">Potential</SelectItem>
                                    <SelectItem value="Appointment">Appointment</SelectItem>
                                    <SelectItem value="Credit">Credit</SelectItem>
                                    <SelectItem value="Closed">Closed</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {isManager && (
                     <FormField
                        control={form.control}
                        name="salespersonId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Assigned To</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select salesperson" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                         {userProfiles.map(p => <SelectItem key={p.uid} value={p.uid}>{p.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <DialogFooter>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
