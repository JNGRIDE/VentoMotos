import { useMemo } from 'react';
import { DollarSign, Hash, BarChart, Trophy } from 'lucide-react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import type { Sale, UserProfile } from '@/lib/data';

interface ReportSummaryProps {
  sales: Sale[];
  userProfiles: UserProfile[];
  isManager: boolean;
}

export function ReportSummary({ sales, userProfiles, isManager }: ReportSummaryProps) {
  const totalSales = useMemo(() => sales.reduce((sum, sale) => sum + sale.amount, 0), [sales]);
  const numberOfSales = sales.length;
  const averageSale = numberOfSales > 0 ? totalSales / numberOfSales : 0;

  const topSalesperson = useMemo(() => {
    if (!isManager || sales.length === 0) return null;

    const salesByPerson: Record<string, number> = {};
    sales.forEach(sale => {
      salesByPerson[sale.salespersonId] = (salesByPerson[sale.salespersonId] || 0) + sale.amount;
    });

    if (Object.keys(salesByPerson).length === 0) return null;

    const topSellerId = Object.keys(salesByPerson).reduce((a, b) => salesByPerson[a] > salesByPerson[b] ? a : b);
    const topSellerProfile = userProfiles.find(p => p.uid === topSellerId);

    return {
      name: topSellerProfile?.name || 'Unknown',
      amount: salesByPerson[topSellerId],
    }
  }, [isManager, sales, userProfiles]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
      <KpiCard
        title="Total Sales Revenue"
        value={`$${totalSales.toLocaleString()}`}
        description={isManager ? "Across all salespeople" : "Your total sales"}
        icon={DollarSign}
      />
      <KpiCard
        title="Number of Sales"
        value={numberOfSales.toString()}
        description={`${sales.filter(s => s.paymentMethod === 'Financing').length} sales with financing`}
        icon={Hash}
      />
      <KpiCard
        title="Average Sale Amount"
        value={`$${averageSale.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
        description="Average value per transaction"
        icon={BarChart}
      />
      {isManager && (
        <KpiCard
          title="Top Performer"
          value={topSalesperson?.name || 'N/A'}
          description={topSalesperson ? `with $${topSalesperson.amount.toLocaleString()} in sales` : "No sales recorded yet"}
          icon={Trophy}
          iconColor="text-yellow-500"
        />
      )}
    </div>
  );
}
