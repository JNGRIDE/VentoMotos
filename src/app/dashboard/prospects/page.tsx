"use client";

import React, { useState, useEffect } from "react";
import { PlusCircle, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "@/components/prospects/kanban-board";
import { useFirestore } from "@/firebase";
import { getProspects } from "@/firebase/db";
import type { Prospect } from "@/lib/data";

export default function ProspectsPage() {
  const db = useFirestore();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProspects = async () => {
      setIsLoading(true);
      const prospectsData = await getProspects(db);
      setProspects(prospectsData);
      setIsLoading(false);
    };
    fetchProspects();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]);

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-[calc(100vh-theme(spacing.32))]">
            <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-theme(spacing.32))]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Prospects Funnel
          </h1>
          <p className="text-muted-foreground">
            Manage your leads from potential to closed.
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
        <KanbanBoard prospects={prospects} />
      </div>
    </div>
  );
}
