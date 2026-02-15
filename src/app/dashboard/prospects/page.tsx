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
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isProspectsLoading, setIsProspectsLoading] = useState(false);

  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<string>('');

  useEffect(() => {
    setSprints(generateSprints());
    setSelectedSprint(getCurrentSprintValue());
  }, []);

  // Fetch static data (profiles) only once or when user changes
  const fetchInitialData = useCallback(async () => {
    if (!user) return;
    setIsInitialLoading(true);
    try {
      const [profile, profilesData] = await Promise.all([
        getUserProfile(db, user.uid),
        getUserProfiles(db)
      ]);

      if (profile) {
        setCurrentUserProfile(profile);
      }
      setUserProfiles(profilesData);
    } catch (err: unknown) {
      console.error("Failed to fetch initial data:", err);
      toast({
        variant: "destructive",
        title: "Error loading profile",
        description: "Could not fetch user profile data.",
      });
    } finally {
      setIsInitialLoading(false);
    }
  }, [db, user, toast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Fetch prospects when sprint changes or refresh is requested
  const fetchProspects = useCallback(async (isRefresh = false) => {
    if (!currentUserProfile || !selectedSprint) return;

    // Only show loading state if not a refresh (or if we want to show loading on sprint change)
    if (!isRefresh) setIsProspectsLoading(true);

    try {
      const prospectsData = await getProspects(db, currentUserProfile, selectedSprint);
      setProspects(prospectsData);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      console.error("Failed to fetch prospects:", err);
      toast({
        variant: "destructive",
        title: "Error loading prospects",
        description: errorObj.message || "Could not fetch data from the database.",
      });
    } finally {
      setIsProspectsLoading(false);
    }
  }, [db, currentUserProfile, selectedSprint, toast]);

  useEffect(() => {
    fetchProspects();
  }, [fetchProspects]);

  const handleRefresh = useCallback(() => {
    fetchProspects(true);
  }, [fetchProspects]);

  const handleOptimisticUpdate = useCallback((updatedProspect: Prospect) => {
    setProspects((prev) =>
      prev.map((p) => (p.id === updatedProspect.id ? updatedProspect : p))
    );
  }, []);

  if (isInitialLoading) {
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
              onProspectAdded={handleRefresh}
            />
        </div>
      </div>
      <div className="flex-1 relative">
        {isProspectsLoading && (
           <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 backdrop-blur-[1px]">
             <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
           </div>
        )}
        <KanbanBoard
            prospects={prospects}
            userProfiles={userProfiles}
            currentUserProfile={currentUserProfile}
            onRefresh={handleRefresh}
            onOptimisticUpdate={handleOptimisticUpdate}
        />
      </div>
    </div>
  );
}
