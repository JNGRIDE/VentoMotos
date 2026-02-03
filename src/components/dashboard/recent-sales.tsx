import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { Sale, Salesperson } from "@/lib/data"
import { useMemo } from "react"

interface RecentSalesProps {
  sales: Sale[];
  salespeople: Salesperson[];
}

export function RecentSales({ sales, salespeople }: RecentSalesProps) {
  const salespeopleMap = useMemo(() => {
    return salespeople.reduce((map, sp) => {
      map[sp.uid] = sp;
      return map;
    }, {} as Record<string, Salesperson>);
  }, [salespeople]);

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle className="font-headline">Recent Sales</CardTitle>
        <CardDescription>
          A log of the most recent motorcycle sales.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Salesperson</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Model</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.slice(0, 5).map((sale) => {
              const salesperson = salespeopleMap[sale.salespersonId];
              return (
              <TableRow key={sale.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={salesperson?.avatarUrl} alt="Avatar" />
                      <AvatarFallback>{salesperson?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="font-medium">{salesperson?.name}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-muted-foreground">{sale.prospectName}</div>
                </TableCell>
                <TableCell>
                  <div className="text-muted-foreground">{sale.motorcycleModel}</div>
                </TableCell>
                <TableCell className="text-right font-medium">${sale.amount.toLocaleString()}</TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
