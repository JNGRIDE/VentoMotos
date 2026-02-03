"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DollarSign, CreditCard, Award, TrendingUp, LoaderCircle, UserPlus, ShieldAlert } from 'lucide-react';
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { KpiCard } from '@/components/dashboard/kpi-card';
import { SalesProgressChart } from '@/components/dashboard/sales-progress-chart';
import { RecentSales } from '@/components/dashboard/recent-sales';
import { RecordSaleDialog } from '@/components/sales/record-sale-dialog';
import { useFirestore } from "@/firebase";
import { useUser } from "@/firebase/auth/use-user";
import { useToast } from "@/hooks/use-toast";
import { getSales, addSale, getUserProfiles, setUserProfile, getUserProfile } from "@/firebase/db";
import { getSalesByUser } from '@/lib/data';
import type { Sale, NewSale, UserProfile } from '@/lib/data';

const ADMIN_UID = "wVN7TmLeOyQDTRevAUWQYDqvou42";

export default function DashboardPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    setCurrentDate(format(new Date(), "EEEE, MMMM d, yyyy"));
  }, []);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const profile = await getUserProfile(db, user.uid);
      if (!profile) {
        // This case might happen for a brand new user before their profile is created.
        // We can either wait or handle it gracefully.
        setIsLoading(false);
        return;
      }
      setCurrentUserProfile(profile);

      const [salesData, profilesData] = await Promise.all([
        getSales(db, profile),
        getUserProfiles(db),
      ]);
      setSales(salesData);
      setUserProfiles(profilesData);
    } catch (error: any) {
      console.error("Failed to fetch data:", error);
      let description = "An unexpected error occurred while fetching data.";
      if (error.code === 'failed-precondition') {
          description = "Could not connect to the database. Have you created a Firestore database in your Firebase project console?";
      } else if (error.code === 'permission-denied') {
          description = "You do not have permission to view this data. Contact your administrator.";
      }
      toast({
        variant: "destructive",
        title: "Error loading dashboard",
        description,
      });
    } finally {
      setIsLoading(false);
    }
  }, [db, toast, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const totalSales = useMemo(() => sales.reduce((sum, sale) => sum + sale.amount, 0), [sales]);
  const totalCredits = useMemo(() => sales.filter(s => s.paymentMethod === 'Financing').length, [sales]);
  const ventoCredits = useMemo(() => sales.filter(s => s.creditProvider === 'Vento').length, [sales]);

  const salesGoal = useMemo(() => {
    if (currentUserProfile?.role === 'Manager') {
      return userProfiles.reduce((sum, sp) => sum + sp.salesGoal, 0);
    }
    return currentUserProfile?.salesGoal || 0;
  }, [userProfiles, currentUserProfile]);
  
  const creditsGoal = useMemo(() => {
    if (currentUserProfile?.role === 'Manager') {
      return userProfiles.reduce((sum, sp) => sum + sp.creditsGoal, 0);
    }
    return currentUserProfile?.creditsGoal || 0;
  }, [userProfiles, currentUserProfile]);


  const salesProgress = salesGoal > 0 ? (totalSales / salesGoal) * 100 : 0;
  const commissionEarned = salesProgress >= 80 ? totalSales * 0.019 : 0;
  const creditBonus = ventoCredits >= 5 ? (ventoCredits - 4) * 200 : 0;

  const teamChartData = useMemo(() => {
    const profilesToChart = currentUserProfile?.role === 'Manager' ? userProfiles : (currentUserProfile ? [currentUserProfile] : []);
    return profilesToChart.map(sp => {
      const spSales = getSalesByUser(sp.uid, sales);
      return {
        ...sp,
        currentSales: spSales.reduce((sum, sale) => sum + sale.amount, 0),
        currentCredits: spSales.filter(s => s.paymentMethod === 'Financing').length,
      }
    });
  }, [sales, userProfiles, currentUserProfile]);
  
  const adminProfileExists = useMemo(() => userProfiles.some(sp => sp.uid === ADMIN_UID), [userProfiles]);

  const handleCreateAdminProfile = useCallback(async () => {
    if (!user || user.uid !== ADMIN_UID) return;

    const adminProfile: UserProfile = {
      uid: ADMIN_UID,
      name: "Admin Manager",
      email: "theinhumanride10@gmail.com",
      salesGoal: 200000,
      creditsGoal: 15,
      avatarUrl: user.photoURL || "https://picsum.photos/seed/admin/100/100",
      role: 'Manager'
    };

    try {
        await setUserProfile(db, adminProfile);
        toast({
          title: "Admin Profile Created!",
          description: "The salesperson profile for the admin has been created.",
        });
        fetchData();
    } catch (error: any) {
        console.error("Failed to create admin profile:", error);
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: error.message || "An unexpected error occurred.",
        });
    }
  }, [db, fetchData, toast, user]);

  const handleAddSale = async (newSaleData: NewSale) => {
    try {
      await addSale(db, newSaleData);
      fetchData();
    } catch (error: any) {
      console.error("Failed to add sale:", error);
      toast({
          variant: "destructive",
          title: "Uh oh! Could not record sale.",
          description: error.message || "An unexpected error occurred.",
      });
      throw error;
    }
  };
  
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
          <p className="text-muted-foreground text-sm">Please contact an administrator to get set up.</p>
      </div>
    )
  }

  const isManager = currentUserProfile.role === 'Manager';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            {isManager ? 'Manager Dashboard' : 'My Dashboard'}
          </h1>
          <p className="text-muted-foreground">
            {currentDate && <>{currentDate} &middot; </>}
            {isManager ? "Here's a summary of your team's sales performance." : "Here's a summary of your sales performance."}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {user && user.uid === ADMIN_UID && !adminProfileExists && (
            <Button onClick={handleCreateAdminProfile} variant="outline" size="sm" className="h-8 gap-1">
              <UserPlus className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Create Admin Profile
              </span>
            </Button>
          )}
          <RecordSaleDialog onAddSale={handleAddSale} currentUserProfile={currentUserProfile} />
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Sales"
          value={`$${totalSales.toLocaleString()}`}
          description={`${salesProgress.toFixed(1)}% of goal ($${salesGoal.toLocaleString()})`}
          icon={DollarSign}
        />
        <KpiCard
          title="Credits Issued"
          value={`${totalCredits}`}
          description={`${ventoCredits} Vento Credits of ${creditsGoal} goal`}
          icon={CreditCard}
        />
        <KpiCard
          title="Commission"
          value={`$${commissionEarned.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
          description={salesProgress < 80 ? `${(80 - salesProgress).toFixed(1)}% to unlock` : "1.9% rate unlocked"}
          icon={TrendingUp}
          iconColor={salesProgress >= 80 ? 'text-green-500' : ''}
        />
        <KpiCard
          title="Vento Bonus"
          value={`$${creditBonus.toLocaleString()}`}
          description={ventoCredits < 5 ? `${5 - ventoCredits} more for bonus` : "$200 per credit after 4"}
          icon={Award}
          iconColor={ventoCredits >= 5 ? 'text-blue-500' : ''}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <SalesProgressChart data={teamChartData} />
        <RecentSales sales={sales} userProfiles={userProfiles} />
      </div>
    </div>
  );
}