"use client";

import React, { useState, useMemo } from 'react';
import { DollarSign, BarChart, CreditCard, Award, TrendingUp, Users } from 'lucide-react';

import { KpiCard } from '@/components/dashboard/kpi-card';
import { SalesProgressChart } from '@/components/dashboard/sales-progress-chart';
import { RecentSales } from '@/components/dashboard/recent-sales';
import { RecordSaleDialog } from '@/components/sales/record-sale-dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import { salespeople, sales as initialSales, getSalesBySalesperson } from '@/lib/data';
import type { Sale } from '@/lib/data';

export default function DashboardPage() {
  const [view, setView] = useState<'manager' | 'salesperson'>('manager');
  const [selectedSalespersonId, setSelectedSalespersonId] = useState(1);
  const [sales, setSales] = useState<Sale[]>(initialSales);
  
  const currentUser = salespeople.find(sp => sp.id === selectedSalespersonId);
  
  const salesData = useMemo(() => {
    if (view === 'manager') return sales;
    return getSalesBySalesperson(selectedSalespersonId, sales);
  }, [view, selectedSalespersonId, sales]);

  const totalSales = useMemo(() => salesData.reduce((sum, sale) => sum + sale.amount, 0), [salesData]);
  const totalCredits = useMemo(() => salesData.filter(s => s.paymentMethod === 'Financing').length, [salesData]);
  const ventoCredits = useMemo(() => salesData.filter(s => s.creditProvider === 'Vento').length, [salesData]);

  const salesGoal = view === 'manager' 
    ? salespeople.reduce((sum, sp) => sum + sp.salesGoal, 0)
    : currentUser?.salesGoal || 0;
  
  const creditsGoal = view === 'manager'
    ? salespeople.reduce((sum, sp) => sum + sp.creditsGoal, 0)
    : currentUser?.creditsGoal || 0;

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

  const salespersonChartData = currentUser ? [{
    ...currentUser,
    currentSales: totalSales,
    currentCredits: totalCredits,
  }] : [];

  const handleAddSale = (newSaleData: Omit<Sale, 'id' | 'date'>) => {
    const newSale: Sale = {
        ...newSaleData,
        id: sales.length + 1,
        date: new Date().toISOString().split('T')[0],
    };
    setSales(prevSales => [newSale, ...prevSales]);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            {view === 'manager' ? 'Manager Dashboard' : `${currentUser?.name}'s Dashboard`}
          </h1>
          <p className="text-muted-foreground">Here's a summary of your sales performance.</p>
        </div>
        <div className="flex items-center space-x-2">
          <RecordSaleDialog onAddSale={handleAddSale} />
        </div>
      </div>
      
      <Tabs defaultValue="manager" onValueChange={(v) => setView(v as 'manager' | 'salesperson')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="manager">Manager View</TabsTrigger>
          <TabsTrigger value="salesperson">Salesperson View</TabsTrigger>
        </TabsList>
        <TabsContent value="manager" />
        <TabsContent value="salesperson">
            <div className="my-4">
                <p className="text-sm text-muted-foreground mb-2">Select a salesperson to view their dashboard:</p>
                <div className="flex flex-wrap gap-2">
                    {salespeople.map(sp => (
                        <Button key={sp.id} variant={selectedSalespersonId === sp.id ? 'default' : 'outline'} onClick={() => setSelectedSalespersonId(sp.id)}>
                            {sp.name}
                        </Button>
                    ))}
                </div>
            </div>
        </TabsContent>
      </Tabs>


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
        <SalesProgressChart data={view === 'manager' ? teamChartData : salespersonChartData} />
        <RecentSales sales={salesData} />
      </div>
    </div>
  );
}
