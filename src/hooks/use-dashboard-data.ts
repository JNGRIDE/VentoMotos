import { useState, useEffect, useCallback } from 'react';
import { useFirestore } from "@/firebase";
import { useUser } from "@/firebase/auth/use-user";
import {
  getSales,
  getUserProfiles,
  getUserProfile,
  addSale,
  deleteSale,
  updateSale,
  setUserProfile,
  getSprints,
  ensureCurrentSprint,
  closeSprint,
  createNextSprint
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
  updateSale: (saleId: string, oldSale: Sale, newSale: NewSale) => Promise<void>;
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

  // Initialize Sprints from DB
  useEffect(() => {
    const initSprints = async () => {
       if (!db) return;
       try {
         // Ensure the current month exists as a sprint
         await ensureCurrentSprint(db);
         // Fetch all sprints
         const sprintList = await getSprints(db);
         setSprints(sprintList);

         // Set default selection to current month
         if (!selectedSprint) {
             setSelectedSprint(getCurrentSprintValue());
         }
       } catch (e) {
         console.error("Failed to init sprints", e);
         // Fallback to generated sprints if DB fails
         const generated = generateSprints();
         setSprints(generated.map(s => ({
             id: s.value,
             label: s.label,
             status: 'active',
             createdAt: new Date().toISOString()
         })));
         if (!selectedSprint) {
            setSelectedSprint(getCurrentSprintValue());
         }
       }
    };
    initSprints();
  }, [db]); // Run once on mount (and when db is ready)

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
      let description = "An unexpected error occurred while fetching data.";
      const errorObj = err as { code?: string, message?: string };

      if (errorObj.code === 'failed-precondition') {
          description = "Could not connect to the database. Have you created a Firestore database in your Firebase project console?";
      } else if (errorObj.code === 'permission-denied') {
          description = "You do not have permission to view this data. Contact your administrator.";
      }
      setError({
        title: "Error loading dashboard",
        description,
      });
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
      uid: ADMIN_UID,
      name: "Admin Manager",
      email: "theinhumanride10@gmail.com",
      avatarUrl: user.photoURL || "https://picsum.photos/seed/admin/100/100",
      salesGoal: 200000,
      creditsGoal: 15,
      role: 'Manager'
    };

    try {
        await setUserProfile(db, adminProfile);
        await fetchData();
    } catch (err: unknown) {
        const errorObj = err as { message?: string };
        console.error("Failed to create admin profile:", err);
        throw new Error(errorObj.message || "An unexpected error occurred.");
    }
  };

  const recordSale = async (newSaleData: NewSale) => {
    try {
      await addSale(db, newSaleData);
      await fetchData();
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      console.error("Failed to add sale:", err);
      throw new Error(errorObj.message || "An unexpected error occurred.");
    }
  };

  const handleDeleteSale = async (sale: Sale) => {
    try {
        await deleteSale(db, sale);
        await fetchData();
    } catch (err: unknown) {
        const errorObj = err as { message?: string };
        console.error("Failed to delete sale:", err);
        throw new Error(errorObj.message || "An unexpected error occurred.");
    }
  }

  const handleUpdateSale = async (saleId: string, oldSale: Sale, newSale: NewSale) => {
      try {
          await updateSale(db, saleId, oldSale, newSale);
          await fetchData();
      } catch (err: unknown) {
          const errorObj = err as { message?: string };
          console.error("Failed to update sale:", err);
          throw new Error(errorObj.message || "An unexpected error occurred.");
      }
  }

  const finishSprint = async (sprintId: string) => {
      try {
          await closeSprint(db, sprintId);
          // Refresh sprints list
          const sprintList = await getSprints(db);
          setSprints(sprintList);
          toastSuccess("Sprint closed successfully.");
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
          toastSuccess("New sprint created!");
      } catch (err) {
          console.error("Failed to start next sprint", err);
          throw err;
      }
  }


  // Helper for internal use, since useToast hook is not here but in the component.
  // We throw error so component handles it.
  const toastSuccess = (msg: string) => {
      // Placeholder if we wanted to handle toast here, but pattern is component handles UI feedback usually.
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
