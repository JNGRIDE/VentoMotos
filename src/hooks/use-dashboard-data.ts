import { useState, useEffect, useCallback } from 'react';
import { useFirestore } from "@/firebase";
import { useUser } from "@/firebase/auth/use-user";
import {
  getSales,
  getUserProfiles,
  getUserProfile,
  addSale,
  deleteSale,
  setUserProfile,
  getSprints,
  ensureCurrentSprint,
  closeSprint,
  createNextSprint
} from "@/firebase/services";
import { updateSaleAndAdjustInventory } from "@/firebase/services/sales"; // <-- IMPORT THE NEW FUNCTION
import { generateSprints, getCurrentSprintValue, type SprintDoc } from '@/lib/sprints';
import type { Sale, UserProfile, NewSale } from '@/lib/data';
import { ADMIN_UID } from '@/lib/constants';

interface UseDashboardDataResult {
  currentUserProfile: UserProfile | null;
  sales: Sale[];
  userProfiles: UserProfile[];
  isLoading: boolean;
  sprints: SprintDoc[];
  selectedSprint: string;
  setSelectedSprint: (sprint: string) => void;
  refreshData: () => Promise<void>;
  createAdminProfile: () => Promise<void>;
  recordSale: (newSaleData: NewSale) => Promise<void>;
  deleteSale: (sale: Sale) => Promise<void>;
  updateSale: (saleId: string, originalSale: Sale, updatedData: Partial<NewSale>) => Promise<void>; // <-- UPDATE SIGNATURE
  finishSprint: (sprintId: string) => Promise<void>;
  startNextSprint: () => Promise<void>;
  error: { title: string; description: string } | null;
}

export function useDashboardData(): UseDashboardDataResult {
  const db = useFirestore();
  const { user } = useUser();

  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ title: string; description: string } | null>(null);

  const [sprints, setSprints] = useState<SprintDoc[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<string>('');

  // Initialize Sprints
  useEffect(() => {
    const initSprints = async () => {
       if (!db) return;
       try {
         await ensureCurrentSprint(db);
         const sprintList = await getSprints(db);
         setSprints(sprintList);
         if (!selectedSprint) {
             setSelectedSprint(getCurrentSprintValue());
         }
       } catch (e) {
         console.error("Failed to init sprints", e);
         const generated = generateSprints();
         setSprints(generated.map(s => ({ id: s.value, label: s.label, status: 'active', createdAt: new Date().toISOString() })));
         if (!selectedSprint) setSelectedSprint(getCurrentSprintValue());
       }
    };
    initSprints();
  }, [db]);

  const fetchData = useCallback(async () => {
    if (!user || !selectedSprint) return;
    setIsLoading(true);
    setError(null);
    try {
      const profile = await getUserProfile(db, user.uid);
      if (!profile) {
        setIsLoading(false);
        return;
      }
      setCurrentUserProfile(profile);

      const [salesData, profilesData] = await Promise.all([
        getSales(db, profile, selectedSprint),
        getUserProfiles(db),
      ]);
      setSales(salesData);
      setUserProfiles(profilesData);
    } catch (err: unknown) {
      console.error("Failed to fetch data:", err);
      const errorObj = err as { code?: string };
      let description = "An unexpected error occurred.";
      if (errorObj.code === 'permission-denied') {
          description = "You do not have permission to view this data. Contact your administrator.";
      }
      setError({ title: "Error loading dashboard", description });
    } finally {
      setIsLoading(false);
    }
  }, [db, user, selectedSprint]);

  useEffect(() => {
    if (selectedSprint) {
      fetchData();
    }
  }, [fetchData, selectedSprint]);

  const createAdminProfile = async () => {
    if (!user || user.uid !== ADMIN_UID) return;
    const adminProfile: UserProfile = {
      uid: ADMIN_UID, name: "Admin Manager", email: "theinhumanride10@gmail.com",
      avatarUrl: user.photoURL || "", salesGoal: 200000, creditsGoal: 15, role: 'Manager'
    };
    try {
        await setUserProfile(db, adminProfile);
        await fetchData();
    } catch (err) {
        console.error("Failed to create admin profile:", err);
        throw err;
    }
  };

  const recordSale = async (newSaleData: NewSale) => {
    try {
      await addSale(db, newSaleData);
      await fetchData();
    } catch (err) {
      console.error("Failed to add sale:", err);
      throw err;
    }
  };

  const handleDeleteSale = async (sale: Sale) => {
    try {
        await deleteSale(db, sale);
        await fetchData();
    } catch (err) {
        console.error("Failed to delete sale:", err);
        throw err;
    }
  }

  // USE THE NEW TRANSACTIONAL FUNCTION
  const handleUpdateSale = async (saleId: string, originalSale: Sale, updatedData: Partial<NewSale>) => {
      try {
          await updateSaleAndAdjustInventory(db, saleId, updatedData, originalSale);
          await fetchData(); // Refresh data to reflect changes
      } catch (err: unknown) {
          console.error("Failed to update sale:", err);
          const errorObj = err as { message?: string };
          throw new Error(errorObj.message || "An unexpected error occurred.");
      }
  }

  const finishSprint = async (sprintId: string) => {
      try {
          await closeSprint(db, sprintId);
          const sprintList = await getSprints(db);
          setSprints(sprintList);
      } catch (err) {
          console.error("Failed to close sprint", err);
          throw err;
      }
  }

  const startNextSprint = async () => {
      try {
          const newSprint = await createNextSprint(db);
          const sprintList = await getSprints(db);
          setSprints(sprintList);
          setSelectedSprint(newSprint.id);
      } catch (err) {
          console.error("Failed to start next sprint", err);
          throw err;
      }
  }

  return {
    currentUserProfile,
    sales,
    userProfiles,
    isLoading,
    sprints,
    selectedSprint,
    setSelectedSprint,
    refreshData: fetchData,
    createAdminProfile,
    recordSale,
    deleteSale: handleDeleteSale,
    updateSale: handleUpdateSale,
    finishSprint,
    startNextSprint,
    error
  };
}
