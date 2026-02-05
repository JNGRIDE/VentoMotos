"use client";

import React, { useState, useEffect, useCallback } from "react";
import { LoaderCircle, ShieldAlert } from "lucide-react";
import { KanbanBoard } from "@/components/prospects/kanban-board";
import { useFirestore } from "@/firebase";
import { useUser } from "@/firebase/auth/use-user";
import { getProspects, getUserProfiles, getUserProfile } from "@/firebase/services";
import type { Prospect, UserProfile } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateSprints, getCurrentSprintValue, type Sprint } from '@/lib/sprints';
import { AddProspectDialog } from "@/components/prospects/add-prospect-dialog";

export default function ProspectsPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<string>('');

  useEffect(() => {
    setSprints(generateSprints());
    setSelectedSprint(getCurrentSprintValue());
  }, []);

  const fetchData = useCallback(async () => {
    if (!user || !selectedSprint) return;
    
    try {
      const profile = await getUserProfile(db, user.uid);
      if (!profile) {
          setIsLoading(false);
          return;
      }
      setCurrentUserProfile(profile);

      const [prospectsData, profilesData] = await Promise.all([
        getProspects(db, profile, selectedSprint),
        getUserProfiles(db),
      ]);
      setProspects(prospectsData);
      setUserProfiles(profilesData);
    } catch (err: unknown) {
        const errorObj = err as { message?: string };
        console.error("Failed to fetch prospects data:", err);
        toast({
            variant: "destructive",
            title: "Error loading prospects",
            description: errorObj.message || "Could not fetch data from the database.",
        });
    } finally {
        setIsLoading(false);
    }
  }, [db, user, toast, selectedSprint]);

  useEffect(() => {
    if(selectedSprint) {
      fetchData();
    }
  }, [fetchData, selectedSprint]);

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-[calc(100vh-theme(spacing.32))]">
            <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
        </div>
    )
  }
  
  if (!currentUserProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-theme(spacing.32))]">
          <ShieldAlert className="h-10 w-10 text-destructive" />
          <h2 className="mt-4 text-xl font-semibold">Profile Not Found</h2>
          <p className="text-muted-foreground mt-2">We couldn't find a user profile for you.</p>
      </div>
    )
  }

  const isManager = currentUserProfile.role === 'Manager';

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-theme(spacing.32))]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            {isManager ? "Team's Prospects Funnel" : "My Prospects Funnel"}
          </h1>
          <p className="text-muted-foreground">
            {isManager ? "Manage all leads from potential to closed." : "Manage your leads from potential to closed."}
          </p>
        </div>
        <div className="flex items-center space-x-2">
            <Select value={selectedSprint} onValueChange={setSelectedSprint}>
                <SelectTrigger className="w-[180px] h-8">
                    <SelectValue placeholder="Select a sprint" />
                </SelectTrigger>
                <SelectContent>
                    {sprints.map((sprint) => (
                        <SelectItem key={sprint.value} value={sprint.value}>
                            {sprint.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <AddProspectDialog
              sprint={selectedSprint}
              currentUserProfile={currentUserProfile}
              onProspectAdded={fetchData}
            />
        </div>
      </div>
      <div className="flex-1">
        <KanbanBoard
            prospects={prospects}
            userProfiles={userProfiles}
            currentUserProfile={currentUserProfile}
            onRefresh={fetchData}
        />
      </div>
    </div>
  );
}
