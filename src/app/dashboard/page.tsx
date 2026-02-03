"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { DollarSign, CreditCard, Award, TrendingUp, LoaderCircle } from 'lucide-react';

import { KpiCard } from '@/components/dashboard/kpi-card';
import { SalesProgressChart } from '@/components/dashboard/sales-progress-chart';
import { RecentSales } from '@/components/dashboard/recent-sales';
import { RecordSaleDialog } from '@/components/sales/record-sale-dialog';
import { useFirestore } from "@/firebase";
import { getSales, addSale } from "@/firebase/db";

import { salespeople, getSalesBySalesperson } from '@/lib/data';
import type { Sale, NewSale } from '@/lib/data';

export default function DashboardPage() {
  const db = useFirestore();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSales = async () => {
    // No need to set loading to true here, handled in useEffect
    const salesData = await getSales(db);
    setSales(salesData);
    setIsLoading(false);
  };

  useEffect(() => {
    setIsLoading(true);
    fetchSales();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]);
  
  const salesData = sales;

  const totalSales = useMemo(() => salesData.reduce((sum, sale) => sum + sale.amount, 0), [salesData]);
  const totalCredits = useMemo(() => salesData.filter(s => s.paymentMethod === 'Financing').length, [salesData]);
  const ventoCredits = useMemo(() => salesData.filter(s => s.creditProvider === 'Vento').length, [salesData]);

  const salesGoal = salespeople.reduce((sum, sp) => sum + sp.salesGoal, 0);
  const creditsGoal = salespeople.reduce((sum, sp) => sum + sp.creditsGoal, 0);

  const salesProgress = salesGoal > 0 ? (totalSales / salesGoal) * 100 : 0;
  const commissionEarned = salesProgress >= 80 ? totalSales * 0.019 : 0;
  const creditBonus = ventoCredits >= 5 ? (ventoCredits - 4) * 200 : 0;

  const teamChartData = useMemo(() => salespeople.map(sp => {
    const spSales = getSalesBySalesperson(sp.id, sales);
    return {
      ...sp,
      currentSales: spSales.reduce((sum, sale) => sum + sale.amount, 0),
      currentCredits: spSales.filter(s => s.paymentMethod === 'Financing').length,
    }
  }), [sales]);

  const handleAddSale = async (newSaleData: NewSale) => {
    await addSale(db, newSaleData);
    fetchSales(); // Refetch sales after adding a new one
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
        <RecentSales sales={salesData} />
      </div>
    </div>
  );
}
