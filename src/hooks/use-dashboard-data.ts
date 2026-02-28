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
  createNextSprint,
  updateSaleAndAdjustInventory, // Use the transactional update function
} from "@/firebase/services";
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
  updateSale: (saleId: string, originalSale: Sale, updatedData: Partial<NewSale>) => Promise<void>;
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
         setError({ title: "Error loading sprints", description: "Could not load the sprint data. Please try again later." });
       }
    };
    initSprints();
  }, [db, selectedSprint]);

  const fetchData = useCallback(async () => {
    if (!user || !selectedSprint || !db) return;
    setIsLoading(true);
    setError(null);
    try {
      const profile = await getUserProfile(db, user.uid);
      if (!profile) {
        // This can happen during initial user profile creation
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
      console.error("Failed to fetch dashboard data:", err);
      const errorObj = err as { code?: string, message?: string };
      let description = errorObj.message || "An unexpected error occurred while fetching data.";
      if (errorObj.code === 'permission-denied') {
          description = "You do not have permission to view this data. Contact your administrator.";
      }
      setError({ title: "Error Loading Dashboard", description });
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
    if (!user || user.uid !== ADMIN_UID || !db) return;
    const adminProfile: UserProfile = {
      uid: ADMIN_UID, name: "Admin Manager", email: "theinhumanride10@gmail.com",
      avatarUrl: user.photoURL || "", salesGoal: 200000, creditsGoal: 15, role: 'Manager'
    };
    await setUserProfile(db, adminProfile);
    await fetchData();
  };

  const recordSale = async (newSaleData: NewSale) => {
    if(!db) return;
    await addSale(db, newSaleData);
    await fetchData();
  };

  const handleDeleteSale = async (sale: Sale) => {
    if(!db) return;
    await deleteSale(db, sale);
    await fetchData();
  }

  const handleUpdateSale = async (saleId: string, originalSale: Sale, updatedData: Partial<NewSale>) => {
      if(!db) return;
      await updateSaleAndAdjustInventory(db, saleId, updatedData, originalSale);
      await fetchData();
  }

  const finishSprint = async (sprintId: string) => {
      if(!db) return;
      await closeSprint(db, sprintId);
      const sprintList = await getSprints(db);
      setSprints(sprintList);
  }

  const startNextSprint = async () => {
      if(!db) return;
      const newSprint = await createNextSprint(db);
      const sprintList = await getSprints(db);
      setSprints(sprintList);
      setSelectedSprint(newSprint.id);
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
