"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts"
import { useMemo } from "react"
import { motion } from "framer-motion"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Sale, UserProfile } from "@/lib/data"


interface SalesBySalespersonChartProps {
  sales: Sale[];
  userProfiles: UserProfile[];
}

export function SalesBySalespersonChart({ sales, userProfiles }: SalesBySalespersonChartProps) {
  const chartData = useMemo(() => {
    const salesByPerson: Record<string, { name: string, sales: number }> = {};

    userProfiles.forEach(profile => {
      if (profile.role === 'Salesperson') {
        salesByPerson[profile.uid] = { name: profile.name.split(' ')[0], sales: 0 };
      }
    });

    sales.forEach(sale => {
      if (salesByPerson[sale.salespersonId]) {
        salesByPerson[sale.salespersonId].sales += sale.amount;
      }
    });

    return Object.values(salesByPerson).filter(item => item.sales > 0);
  }, [sales, userProfiles]);
  
  return (
    <Card className="border-none shadow-soft overflow-hidden rounded-[32px] group transition-all duration-500 hover:shadow-premium print:border-0 print:shadow-none">
      <CardHeader className="p-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-headline text-2xl">Rendimiento por Ejecutivo</CardTitle>
            <CardDescription className="text-base">Distribución del ingreso total generado este mes.</CardDescription>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
            <TrendingUpIcon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-8">
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                dy={10}
                fontWeight="600"
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `$${value/1000}k`} 
                fontWeight="600"
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--primary) / 0.05)', radius: 12 }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '1.5rem',
                  padding: '1rem',
                  boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.15)',
                  border: 'none',
                }}
                itemStyle={{ fontWeight: 'bold' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, "Ventas"]}
              />
              <Bar 
                dataKey="sales" 
                radius={[12, 12, 4, 4]} 
                barSize={45}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted))'} 
                    className="transition-all duration-500 hover:opacity-80"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function TrendingUpIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 16 8.5 11 2 16" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  )
}
