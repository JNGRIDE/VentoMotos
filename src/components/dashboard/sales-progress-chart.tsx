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
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)',
              }}
              labelStyle={{
                color: 'hsl(var(--foreground))'
              }}
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
