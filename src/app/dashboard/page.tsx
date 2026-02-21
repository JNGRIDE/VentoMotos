"use client";

import React, { useMemo, useEffect } from 'react';
import { DollarSign, CreditCard, Award, TrendingUp, UserPlus, ShieldAlert, Download, CalendarOff, CalendarPlus } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { KpiCard } from '@/components/dashboard/kpi-card';
import { SalesProgressChart } from '@/components/dashboard/sales-progress-chart';
import { RecentSales } from '@/components/dashboard/recent-sales';
import { RecordSaleDialog } from '@/components/sales/record-sale-dialog';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { useToast } from "@/hooks/use-toast";
import { getSalesByUser, type NewSale, type Sale } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ADMIN_UID, COMMISSION_RATES, GOALS } from '@/lib/constants';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { useUser } from '@/firebase/auth/use-user';
import { exportSalesToCSV } from '@/lib/export-utils';

export default function DashboardPage() {
  const { user } = useUser();
  const { toast } = useToast();
  
  const {
    currentUserProfile,
    sales,
    userProfiles,
    isLoading,
    sprints,
    selectedSprint,
    setSelectedSprint,
    createAdminProfile,
    recordSale,
    deleteSale,
    updateSale,
    finishSprint,
    startNextSprint,
    error
  } = useDashboardData();

  // Show error toast if error occurs in hook
  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: error.title,
        description: error.description,
      });
    }
  }, [error, toast]);
  
  const isManager = currentUserProfile?.role === 'Manager';
  
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
  
  const commissionData = useMemo(() => {
    const commissionRate = isManager ? COMMISSION_RATES.MANAGER : COMMISSION_RATES.SALESPERSON;
    // Calculate commission immediately on net sales (totalSales is stored as net)
    const earned = totalSales * commissionRate;

    const isUnlocked = salesProgress >= GOALS.SALES_PROGRESS_THRESHOLD;

    let description = "";
    let iconColor = "text-gray-400";
    let valueClassName = "text-gray-400";
    let descriptionClassName = "";

    if (salesProgress < GOALS.SALES_PROGRESS_THRESHOLD) {
       const amountToUnlock = (salesGoal * (GOALS.SALES_PROGRESS_THRESHOLD / 100)) - totalSales;
       description = `Pending - $${Math.max(0, amountToUnlock).toLocaleString()} to unlock (${GOALS.SALES_PROGRESS_THRESHOLD}%)`;
       // default colors
    } else if (salesProgress < 100) {
       const amountToGoal = salesGoal - totalSales;
       description = `Active - $${Math.max(0, amountToGoal).toLocaleString()} to reach goal (100%)`;
       iconColor = "text-green-500";
       valueClassName = "text-green-600";
    } else {
       // >= 100%
       description = `${salesProgress.toFixed(0)}% of Goal!`; // Using toFixed(0) for clean 101%, 102%
       iconColor = "text-yellow-500";
       valueClassName = "text-yellow-600";
       descriptionClassName = "text-yellow-600 font-medium";
    }

    return { earned, description, iconColor, valueClassName, descriptionClassName };
  }, [isManager, salesProgress, totalSales, salesGoal]);

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

  const currentSprintStatus = useMemo(() => {
     const s = sprints.find(sp => sp.id === selectedSprint);
     return s ? s.status : 'closed';
  }, [sprints, selectedSprint]);

  const handleCreateAdminProfile = async () => {
    try {
        await createAdminProfile();
        toast({
          title: "Admin Profile Created!",
          description: "The salesperson profile for the admin has been created.",
        });
    } catch (err: unknown) {
        const errorObj = err as { message?: string };
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: errorObj.message || "An unexpected error occurred.",
        });
    }
  };

  const handleAddSale = async (newSaleData: NewSale) => {
    try {
      await recordSale(newSaleData);
      toast({
        title: "Sale Recorded!",
        description: "The sale has been successfully added.",
      });
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      toast({
          variant: "destructive",
          title: "Uh oh! Could not record sale.",
          description: errorObj.message || "An unexpected error occurred.",
      });
      throw err;
    }
  };

  const handleDeleteSale = async (sale: Sale) => {
      try {
          await deleteSale(sale);
          toast({ title: "Sale Deleted", description: "The sale has been removed and inventory restored." });
      } catch (err: unknown) {
          const errorObj = err as { message?: string };
          toast({ variant: "destructive", title: "Error", description: errorObj.message || "Failed to delete sale." });
      }
  }
  
  const handleFinishSprint = async () => {
      if (confirm("Are you sure you want to close this sprint? This action cannot be undone.")) {
          try {
              await finishSprint(selectedSprint);
              toast({ title: "Sprint Closed", description: "The sprint has been successfully closed." });
          } catch (e) {
              toast({ variant: "destructive", title: "Error", description: "Failed to close sprint." });
          }
      }
  };

  const handleStartNextSprint = async () => {
    try {
        await startNextSprint();
        toast({ title: "New Sprint Started", description: "The next month's sprint has been created and selected." });
    } catch (e) {
        toast({ variant: "destructive", title: "Error", description: "Failed to start new sprint." });
    }
  };

  if (isLoading) {
    return <DashboardSkeleton />;
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            {isManager ? 'Manager Dashboard' : 'My Dashboard'}
          </h1>
          <p className="text-muted-foreground">
            {isManager ? "Here's a summary of your team's sales performance." : "Here's a summary of your sales performance."}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedSprint} onValueChange={setSelectedSprint}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a sprint" />
            </SelectTrigger>
            <SelectContent>
              {sprints.map((sprint) => (
                <SelectItem key={sprint.id} value={sprint.id}>
                  {sprint.label} {sprint.status === 'closed' ? '(Closed)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isManager && (
            <>
                <Button onClick={handleStartNextSprint} variant="outline" size="sm" className="h-8 gap-1">
                    <CalendarPlus className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">New Sprint</span>
                </Button>

                {currentSprintStatus === 'active' && (
                    <Button onClick={handleFinishSprint} variant="destructive" size="sm" className="h-8 gap-1">
                        <CalendarOff className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">End Sprint</span>
                    </Button>
                )}
            </>
          )}

          {user && user.uid === ADMIN_UID && !adminProfileExists && (
            <Button onClick={handleCreateAdminProfile} variant="outline" size="sm" className="h-8 gap-1">
              <UserPlus className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Create Admin Profile
              </span>
            </Button>
          )}
          {sales.length > 0 && (
            <Button onClick={() => exportSalesToCSV(sales, `sales-${selectedSprint}`)} variant="outline" size="sm" className="h-8 gap-1">
              <Download className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Export
              </span>
            </Button>
          )}
          {currentSprintStatus === 'active' && (
             <RecordSaleDialog onAddSale={handleAddSale} currentUserProfile={currentUserProfile} sprint={selectedSprint} />
          )}
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Sales"
          value={`$${totalSales.toLocaleString()}`}
          description={`${salesProgress.toFixed(1)}% of goal ($${salesGoal.toLocaleString()}). Missing: $${Math.max(0, salesGoal - totalSales).toLocaleString()}`}
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
          value={`$${commissionData.earned.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
          description={commissionData.description}
          icon={TrendingUp}
          iconColor={commissionData.iconColor}
          valueClassName={commissionData.valueClassName}
          descriptionClassName={commissionData.descriptionClassName}
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
        <RecentSales
          sales={sales}
          userProfiles={userProfiles}
          onDeleteSale={currentSprintStatus === 'active' ? handleDeleteSale : undefined}
          onUpdateSale={currentSprintStatus === 'active' ? updateSale : undefined}
          currentUserProfile={currentUserProfile}
        />
      </div>
    </div>
  );
}
