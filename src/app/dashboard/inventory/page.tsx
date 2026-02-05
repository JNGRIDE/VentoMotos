"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { LoaderCircle, ShieldAlert } from 'lucide-react';
import { useFirestore } from "@/firebase";
import { useUser } from "@/firebase/auth/use-user";
import { useToast } from "@/hooks/use-toast";
import { getUserProfile, getInventory } from '@/firebase/services';
import type { UserProfile, Motorcycle } from '@/lib/data';
import { InventoryTable } from '@/components/inventory/inventory-table';
import { AddMotorcycleDialog } from '@/components/inventory/add-motorcycle-dialog';
import { UploadInventoryDialog } from '@/components/inventory/upload-inventory-dialog';

export default function InventoryPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [inventory, setInventory] = useState<Motorcycle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const profile = await getUserProfile(db, user.uid);
      setCurrentUserProfile(profile);

      if (profile?.role === 'Manager') {
        const inventoryData = await getInventory(db);
        setInventory(inventoryData);
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error("Failed to fetch inventory data:", err);
      toast({
        variant: "destructive",
        title: "Error loading inventory",
        description: err.message || "Could not fetch data from the database.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [db, toast, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-theme(spacing.32))]">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (currentUserProfile?.role !== 'Manager') {
    return (
       <div className="flex flex-col items-center justify-center h-[calc(100vh-theme(spacing.32))]">
          <ShieldAlert className="h-10 w-10 text-destructive" />
          <h2 className="mt-4 text-xl font-semibold">Access Denied</h2>
          <p className="text-muted-foreground mt-2">Only managers can access this page.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Motorcycle Inventory
          </h1>
          <p className="text-muted-foreground">
            Manage stock levels for all available models.
          </p>
        </div>
        <div className="flex items-center space-x-2">
            <UploadInventoryDialog onInventoryUpdated={fetchData} />
            <AddMotorcycleDialog onMotorcycleAdded={fetchData} />
        </div>
      </div>
      <InventoryTable inventory={inventory} onInventoryUpdated={fetchData} />
    </div>
  );
}
