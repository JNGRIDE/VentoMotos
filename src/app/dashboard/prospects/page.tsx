"use client";

import React, { useState, useEffect, useCallback } from "react";
import { LoaderCircle, ShieldAlert, Kanban as KanbanIcon, ListFilter } from "lucide-react";
import { KanbanBoard } from "@/components/prospects/kanban-board";
import { useFirestore } from "@/firebase";
import { useUser } from "@/firebase/auth/use-user";
import { getProspects, getUserProfiles, getUserProfile } from "@/firebase/services";
import type { Prospect, UserProfile } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateSprints, getCurrentSprintValue, type Sprint } from '@/lib/sprints';
import { AddProspectDialog } from "@/components/prospects/add-prospect-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PROSPECT_STAGES } from "@/lib/data";

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
  const [activeTab, setActiveTab] = useState<string>("all");

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
      <div className="flex flex-col items-center justify-center h-[calc(100vh-theme(spacing.32))] px-4 text-center">
          <ShieldAlert className="h-16 w-16 text-destructive/20" />
          <h2 className="mt-4 text-xl font-bold">Perfil No Encontrado</h2>
          <p className="text-muted-foreground mt-2">No pudimos encontrar tu perfil de usuario en el sistema.</p>
      </div>
    )
  }

  const isManager = currentUserProfile.role === 'Manager';

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
            {isManager ? "Embudo del Equipo" : "Mis Prospectos"}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {isManager ? "Seguimiento de todos los leads del equipo." : "Gestiona tus leads de potencial a cierre."}
          </p>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            <Select value={selectedSprint} onValueChange={setSelectedSprint}>
                <SelectTrigger className="w-[140px] md:w-[180px] h-9 rounded-xl">
                    <SelectValue placeholder="Sprint" />
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

      {/* Selector de Etapa para Móvil */}
      <div className="md:hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto bg-transparent h-auto p-0 gap-2 no-scrollbar">
            <TabsTrigger 
              value="all" 
              className="rounded-full border border-border/40 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary px-4 py-1.5 text-xs font-bold transition-all"
            >
              <KanbanIcon className="h-3 w-3 mr-1.5" /> Todo
            </TabsTrigger>
            {PROSPECT_STAGES.map((stage) => (
              <TabsTrigger 
                key={stage} 
                value={stage}
                className="rounded-full border border-border/40 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary px-4 py-1.5 text-xs font-bold transition-all whitespace-nowrap"
              >
                {stage}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 relative min-h-[500px]">
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
            activeTab={activeTab}
        />
      </div>
    </div>
  );
}
