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
    "Credits Goal": sp.creditsGoal * 10000, // Scale for visibility on same chart
    "Current Credits": sp.currentCredits * 10000,
  }));
  
  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader>
        <CardTitle className="font-headline">Monthly Sprint Progress</CardTitle>
        <CardDescription>Sales and credit goals performance by salesperson.</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === "Current Credits" || name === "Credits Goal") {
                  // Un-scale the credit values for display
                  return [Math.round(value / 10000), name];
                }
                if (typeof value === 'number') {
                  const formattedValue = new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                    maximumFractionDigits: 0,
                  }).format(value);
                  return [formattedValue, name];
                }
                return [value, name];
              }}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)',
                padding: '0.5rem 1rem',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
              }}
              labelStyle={{
                color: 'hsl(var(--foreground))',
                fontWeight: 'bold',
                marginBottom: '0.5rem',
              }}
              itemStyle={{
                  color: 'hsl(var(--foreground))',
                  paddingBottom: '0.25rem'
              }}
              cursor={{ fill: 'hsl(var(--accent) / 0.2)' }}
            />
            <Legend iconSize={10} />
            <Bar dataKey="Sales Goal" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Current Sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Current Credits" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
