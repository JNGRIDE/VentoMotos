import { useMemo } from 'react';
import { DollarSign, Hash, BarChart, Trophy, CreditCard, Banknote } from 'lucide-react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import type { Sale, UserProfile } from '@/lib/data';
import { EXTERNAL_SALESPERSON_ID } from '@/lib/constants';
import { motion } from 'framer-motion';

interface ReportSummaryProps {
  sales: Sale[];
  userProfiles: UserProfile[];
  isManager: boolean;
}

export function ReportSummary({ sales, userProfiles, isManager }: ReportSummaryProps) {
  const totalSales = useMemo(() => sales.reduce((sum, sale) => sum + sale.amount, 0), [sales]);
  const numberOfSales = sales.length;
  const averageSale = numberOfSales > 0 ? totalSales / numberOfSales : 0;
  
  const financingSales = useMemo(() => sales.filter(s => s.paymentMethod === 'Financing').length, [sales]);
  const cashSales = numberOfSales - financingSales;

  const topSalesperson = useMemo(() => {
    if (!isManager || sales.length === 0) return null;

    const salesByPerson: Record<string, number> = {};
    sales.forEach(sale => {
      if (sale.salespersonId !== EXTERNAL_SALESPERSON_ID) {
        salesByPerson[sale.salespersonId] = (salesByPerson[sale.salespersonId] || 0) + sale.amount;
      }
    });

    if (Object.keys(salesByPerson).length === 0) return null;

    const topSellerId = Object.keys(salesByPerson).reduce((a, b) => salesByPerson[a] > salesByPerson[b] ? a : b);
    const topSellerProfile = userProfiles.find(p => p.uid === topSellerId);

    return {
      name: topSellerProfile?.name?.split(' ')[0] || 'Desconocido',
      amount: salesByPerson[topSellerId],
    }
  }, [isManager, sales, userProfiles]);

  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
      <KpiCard
        title="Ingresos Totales"
        value={`$${totalSales.toLocaleString()}`}
        description={isManager ? "Venta bruta de la sucursal" : "Tu volumen de venta total"}
        icon={DollarSign}
        iconColor="text-primary"
        delay={0.1}
      />
      
      <KpiCard
        title="Operaciones"
        value={numberOfSales.toString()}
        description={`${financingSales} Créditos / ${cashSales} Contados`}
        icon={Hash}
        iconColor="text-blue-500"
        delay={0.2}
      />
      
      <KpiCard
        title="Ticket Promedio"
        value={`$${averageSale.toLocaleString('es-MX', {maximumFractionDigits: 0})}`}
        description="Monto promedio por factura"
        icon={BarChart}
        iconColor="text-orange-500"
        delay={0.3}
      />

      {isManager ? (
        <KpiCard
          title="Líder de Ventas"
          value={topSalesperson?.name || 'N/A'}
          description={topSalesperson ? `Lidera con $${topSalesperson.amount.toLocaleString()}` : "Sin datos de ventas"}
          icon={Trophy}
          iconColor="text-accent"
          delay={0.4}
        />
      ) : (
        <KpiCard
          title="Mix de Pago"
          value={`${((financingSales / (numberOfSales || 1)) * 100).toFixed(0)}%`}
          description="Porcentaje de ventas a crédito"
          icon={CreditCard}
          iconColor="text-accent"
          delay={0.4}
        />
      )}
    </div>
  );
}
