import { useMemo } from "react"
import { format } from "date-fns"
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

import type { Sale, UserProfile } from "@/lib/data"

interface SalesDetailTableProps {
  sales: Sale[];
  userProfiles: UserProfile[];
}

export function SalesDetailTable({ sales, userProfiles }: SalesDetailTableProps) {
  const userProfilesMap = useMemo(() => {
    return userProfiles.reduce((map, sp) => {
      map[sp.uid] = sp;
      return map;
    }, {} as Record<string, UserProfile>);
  }, [userProfiles]);

  return (
    <Card className="print:border-0 print:shadow-none">
      <CardHeader>
        <CardTitle className="font-headline">Detailed Sales Log</CardTitle>
        <CardDescription>
          A complete list of all sales recorded in the selected period.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Date</TableHead>
              <TableHead>Salesperson</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => {
              const userProfile = userProfilesMap[sale.salespersonId];
              return (
              <TableRow key={sale.id}>
                <TableCell className="font-medium">{format(new Date(sale.date), "MMM d, yyyy")}</TableCell>
                <TableCell>{userProfile?.name || 'N/A'}</TableCell>
                <TableCell>{sale.prospectName}</TableCell>
                <TableCell>{sale.motorcycleModel}</TableCell>
                <TableCell>{sale.paymentMethod}</TableCell>
                <TableCell className="text-right font-medium">${sale.amount.toLocaleString()}</TableCell>
              </TableRow>
            )})}
             {sales.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                    No sales recorded.
                    </TableCell>
                </TableRow>
             )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
