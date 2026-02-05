import { useState, useEffect, useCallback } from 'react';
import { useFirestore } from "@/firebase";
import { useUser } from "@/firebase/auth/use-user";
import { getSales, getUserProfiles, getUserProfile, addSale, setUserProfile } from "@/firebase/services";
import { generateSprints, getCurrentSprintValue, type Sprint } from '@/lib/sprints';
import type { Sale, UserProfile, NewSale } from '@/lib/data';
import { ADMIN_UID } from '@/lib/constants';

interface UseDashboardDataResult {
  currentUserProfile: UserProfile | null;
  sales: Sale[];
  userProfiles: UserProfile[];
  isLoading: boolean;
  sprints: Sprint[];
  selectedSprint: string;
  setSelectedSprint: (sprint: string) => void;
  refreshData: () => Promise<void>;
  createAdminProfile: () => Promise<void>;
  recordSale: (newSaleData: NewSale) => Promise<void>;
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

  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<string>('');

  useEffect(() => {
    setSprints(generateSprints());
    setSelectedSprint(getCurrentSprintValue());
  }, []);

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
    error
  };
}
