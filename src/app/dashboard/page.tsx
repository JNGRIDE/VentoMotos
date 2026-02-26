"use client";

import React, { useMemo, useEffect } from 'react';
import { DollarSign, CreditCard, Award, TrendingUp, UserPlus, ShieldAlert, Download, CalendarOff, CalendarPlus, ChevronRight } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    const earned = totalSales * commissionRate;
    const isUnlocked = salesProgress >= GOALS.SALES_PROGRESS_THRESHOLD;

    let description = "";
    let iconColor = "text-muted-foreground";
    let valueClassName = "text-muted-foreground opacity-50";
    let descriptionClassName = "";

    if (salesProgress < GOALS.SALES_PROGRESS_THRESHOLD) {
       const amountToUnlock = (salesGoal * (GOALS.SALES_PROGRESS_THRESHOLD / 100)) - totalSales;
       description = `Missing $${Math.max(0, amountToUnlock).toLocaleString()} to unlock`;
    } else if (salesProgress < 100) {
       description = `Goal is within reach!`;
       iconColor = "text-primary";
       valueClassName = "text-primary";
    } else {
       description = `${salesProgress.toFixed(0)}% of Goal!`;
       iconColor = "text-accent";
       valueClassName = "text-accent";
       descriptionClassName = "text-accent font-bold";
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

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!currentUserProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-theme(spacing.32))] animate-in fade-in">
          <ShieldAlert className="h-16 w-16 text-destructive/20" />
          <h2 className="mt-4 text-2xl font-bold">Profile Not Found</h2>
          <p className="text-muted-foreground mt-2">Please contact an administrator to get set up.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Header Section style Apple */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight">
            Hello, {currentUserProfile.name.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground text-lg">
            Explore information and activity about your branch.
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-card/50 backdrop-blur-md p-1.5 rounded-3xl shadow-soft border border-border/20">
          <Select value={selectedSprint} onValueChange={setSelectedSprint}>
            <SelectTrigger className="w-[180px] border-none bg-transparent h-10 rounded-2xl focus:ring-0 shadow-none hover:bg-secondary/40">
              <SelectValue placeholder="Sprint" />
            </SelectTrigger>
            <SelectContent>
              {sprints.map((sprint) => (
                <SelectItem key={sprint.id} value={sprint.id}>
                  {sprint.label} {sprint.status === 'closed' ? '🔒' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isManager && (
            <div className="flex gap-1 border-l border-border/40 pl-1">
                <Button onClick={startNextSprint} variant="ghost" size="icon" className="h-10 w-10 rounded-2xl hover:bg-secondary/60">
                    <CalendarPlus className="h-5 w-5 text-primary" />
                </Button>
                {currentSprintStatus === 'active' && (
                    <Button onClick={finishSprint} variant="ghost" size="icon" className="h-10 w-10 rounded-2xl hover:bg-destructive/10">
                        <CalendarOff className="h-5 w-5 text-destructive" />
                    </Button>
                )}
            </div>
          )}
          
          <div className="border-l border-border/40 pl-1">
            {currentSprintStatus === 'active' && (
               <RecordSaleDialog onAddSale={recordSale} currentUserProfile={currentUserProfile} sprint={selectedSprint} />
            )}
          </div>
        </div>
      </div>
      
      {/* KPIs Grid style Tile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard
            title="Total Sales"
            value={`$${totalSales.toLocaleString()}`}
            description={`${salesProgress.toFixed(1)}% of goal`}
            icon={DollarSign}
            iconColor="text-primary"
          />
          <KpiCard
            title="Number of Sales"
            value={`${sales.length}`}
            description={`${totalCredits} Financing deals`}
            icon={TrendingUp}
            iconColor="text-orange-500"
          />
          <KpiCard
            title="Commission"
            value={`$${commissionData.earned.toLocaleString(undefined, {maximumFractionDigits: 0})}`}
            description={commissionData.description}
            icon={Award}
            iconColor={commissionData.iconColor}
            valueClassName={commissionData.valueClassName}
            descriptionClassName={commissionData.descriptionClassName}
          />
          <KpiCard
            title="Vento Bonus"
            value={`$${creditBonus.toLocaleString()}`}
            description={`${ventoCredits} Vento Credits`}
            icon={CreditCard}
            iconColor="text-accent"
          />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-10">
          <SalesProgressChart data={teamChartData} />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-2xl font-bold tracking-tight">Recent Activity</h3>
              <Button variant="link" className="text-primary font-semibold flex items-center gap-1 group">
                See All <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
            <RecentSales
              sales={sales}
              userProfiles={userProfiles}
              onDeleteSale={currentSprintStatus === 'active' ? deleteSale : undefined}
              onUpdateSale={currentSprintStatus === 'active' ? updateSale : undefined}
              currentUserProfile={currentUserProfile}
            />
          </div>
        </div>

        {/* Sidebar inside dashboard */}
        <div className="space-y-8">
           <Card className="border-none bg-gradient-to-br from-primary to-accent text-primary-foreground p-8 rounded-[32px] shadow-premium relative overflow-hidden group">
              <div className="relative z-10 space-y-4">
                <div className="h-12 w-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xl font-bold">Monthly Challenge</h4>
                  <p className="text-white/80 text-sm">Reach 100% of your sales goal to unlock the elite bonus tier.</p>
                </div>
                <div className="pt-4">
                  <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white transition-all duration-1000" style={{ width: `${Math.min(100, salesProgress)}%` }}></div>
                  </div>
                  <p className="text-xs text-white/60 mt-2 text-right font-medium">{salesProgress.toFixed(0)}% Completed</p>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute top-[-20%] right-[-20%] h-64 w-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-500"></div>
           </Card>

           <div className="space-y-4">
              <h4 className="text-lg font-bold px-2">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => exportSalesToCSV(sales, `sales-${selectedSprint}`)} variant="outline" className="h-auto py-6 flex-col gap-2 rounded-3xl border-border/40 shadow-soft hover:bg-secondary/50">
                  <Download className="h-6 w-6 text-primary" />
                  <span className="font-semibold text-sm">Export CSV</span>
                </Button>
                {user?.uid === ADMIN_UID && !adminProfileExists && (
                  <Button onClick={createAdminProfile} variant="outline" className="h-auto py-6 flex-col gap-2 rounded-3xl border-border/40 shadow-soft hover:bg-secondary/50">
                    <UserPlus className="h-6 w-6 text-accent" />
                    <span className="font-semibold text-sm">Admin Profile</span>
                  </Button>
                )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
