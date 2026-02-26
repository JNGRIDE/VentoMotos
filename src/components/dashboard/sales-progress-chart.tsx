"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { UserProfile } from "@/lib/data"

interface SalesProgressChartProps {
  data: (UserProfile & { currentSales: number, currentCredits: number })[];
}

export function SalesProgressChart({ data }: SalesProgressChartProps) {
  const chartData = data.map(sp => ({
    name: sp.name.split(' ')[0],
    "Sales Goal": sp.salesGoal,
    "Current Sales": sp.currentSales,
    "Credits Goal": sp.creditsGoal * 10000,
    "Current Credits": sp.currentCredits * 10000,
  }));
  
  return (
    <Card className="w-full border-none shadow-soft overflow-hidden">
      <CardHeader className="p-8">
        <CardTitle className="font-headline text-2xl">Monthly Sprint Progress</CardTitle>
        <CardDescription className="text-base">Performance breakdown by salesperson.</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-8">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              dy={10}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(value) => `$${value/1000}k`} 
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--primary) / 0.05)', radius: 8 }}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderRadius: '1.5rem',
                padding: '1rem',
                boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.15)',
                border: 'none',
              }}
              formatter={(value: number, name: string) => {
                if (name === "Current Credits" || name === "Credits Goal") {
                  return [Math.round(value / 10000), name];
                }
                return [new Intl.NumberFormat('es-MX', {
                  style: 'currency',
                  currency: 'MXN',
                  maximumFractionDigits: 0,
                }).format(value), name];
              }}
            />
            <Legend 
              iconType="circle" 
              wrapperStyle={{ paddingTop: '20px' }}
            />
            <Bar dataKey="Sales Goal" fill="hsl(var(--muted))" radius={[10, 10, 10, 10]} barSize={24} />
            <Bar dataKey="Current Sales" fill="hsl(var(--primary))" radius={[10, 10, 10, 10]} barSize={24} />
            <Bar dataKey="Current Credits" fill="hsl(var(--chart-2))" radius={[10, 10, 10, 10]} barSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}