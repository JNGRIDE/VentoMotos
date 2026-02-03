"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DollarSign, CreditCard, Award, TrendingUp, LoaderCircle, UserPlus } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { KpiCard } from '@/components/dashboard/kpi-card';
import { SalesProgressChart } from '@/components/dashboard/sales-progress-chart';
import { RecentSales } from '@/components/dashboard/recent-sales';
import { RecordSaleDialog } from '@/components/sales/record-sale-dialog';
import { useFirestore } from "@/firebase";
import { useUser } from "@/firebase/auth/use-user";
import { useToast } from "@/hooks/use-toast";
import { getSales, addSale, getSalespeople, setSalesperson } from "@/firebase/db";

import { getSalesBySalesperson } from '@/lib/data';
import type { Sale, NewSale, Salesperson } from '@/lib/data';

const ADMIN_UID = "wVN7TmLeOyQDTRevAUWQYDqvou42";

export default function DashboardPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const [salesData, salespeopleData] = await Promise.all([
      getSales(db),
      getSalespeople(db),
    ]);
    setSales(salesData);
    setSalespeople(salespeopleData);
    setIsLoading(false);
  }, [db]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const totalSales = useMemo(() => sales.reduce((sum, sale) => sum + sale.amount, 0), [sales]);
  const totalCredits = useMemo(() => sales.filter(s => s.paymentMethod === 'Financing').length, [sales]);
  const ventoCredits = useMemo(() => sales.filter(s => s.creditProvider === 'Vento').length, [sales]);

  const salesGoal = useMemo(() => salespeople.reduce((sum, sp) => sum + sp.salesGoal, 0), [salespeople]);
  const creditsGoal = useMemo(() => salespeople.reduce((sum, sp) => sum + sp.creditsGoal, 0), [salespeople]);

  const salesProgress = salesGoal > 0 ? (totalSales / salesGoal) * 100 : 0;
  const commissionEarned = salesProgress >= 80 ? totalSales * 0.019 : 0;
  const creditBonus = ventoCredits >= 5 ? (ventoCredits - 4) * 200 : 0;

  const teamChartData = useMemo(() => salespeople.map(sp => {
    const spSales = getSalesBySalesperson(sp.uid, sales);
    return {
      ...sp,
      currentSales: spSales.reduce((sum, sale) => sum + sale.amount, 0),
      currentCredits: spSales.filter(s => s.paymentMethod === 'Financing').length,
    }
  }), [sales, salespeople]);
  
  const adminProfileExists = useMemo(() => salespeople.some(sp => sp.uid === ADMIN_UID), [salespeople]);

  const handleCreateAdminProfile = useCallback(async () => {
    if (!user || user.uid !== ADMIN_UID) return;

    const adminProfile: Salesperson = {
      uid: ADMIN_UID,
      name: "Admin Manager",
      email: user.email || "admin@example.com",
      salesGoal: 200000,
      creditsGoal: 15,
      avatarUrl: "https://picsum.photos/seed/admin/100/100"
    };

    await setSalesperson(db, adminProfile);

    toast({
      title: "Admin Profile Created!",
      description: "The salesperson profile for the admin has been created.",
    });

    fetchData();
  }, [db, fetchData, toast, user]);

  const handleAddSale = async (newSaleData: NewSale) => {
    await addSale(db, newSaleData);
    fetchData(); // Refetch all data after adding a new one
  };
  
  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-[calc(100vh-theme(spacing.32))]">
            <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Manager Dashboard
          </h1>
          <p className="text-muted-foreground">Here's a summary of your team's sales performance.</p>
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
          <RecordSaleDialog onAddSale={handleAddSale} />
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
        <RecentSales sales={sales} salespeople={salespeople} />
      </div>
    </div>
  );
}
