"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PlusCircle, LoaderCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "@/components/prospects/kanban-board";
import { useFirestore } from "@/firebase";
import { useUser } from "@/firebase/auth/use-user";
import { getProspects, getUserProfiles, getUserProfile } from "@/firebase/services";
import type { Prospect, UserProfile } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";


export default function ProspectsPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const profile = await getUserProfile(db, user.uid);
      if (!profile) {
          setIsLoading(false);
          return;
      }
      setCurrentUserProfile(profile);

      const [prospectsData, profilesData] = await Promise.all([
        getProspects(db, profile),
        getUserProfiles(db),
      ]);
      setProspects(prospectsData);
      setUserProfiles(profilesData);
    } catch (error: any) {
        console.error("Failed to fetch prospects data:", error);
        toast({
            variant: "destructive",
            title: "Error loading prospects",
            description: error.message || "Could not fetch data from the database.",
        });
    } finally {
        setIsLoading(false);
    }
  }, [db, user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        <Button size="sm" className="h-8 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Add Prospect
          </span>
        </Button>
      </div>
      <div className="flex-1">
        <KanbanBoard prospects={prospects} userProfiles={userProfiles} />
      </div>
    </div>
  );
}
