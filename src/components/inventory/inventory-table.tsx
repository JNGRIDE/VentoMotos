import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { Motorcycle } from "@/lib/data"

interface InventoryTableProps {
  inventory: Motorcycle[];
}

export function InventoryTable({ inventory }: InventoryTableProps) {
  return (
    <Card>
       <CardHeader>
        <CardTitle className="font-headline">Current Stock</CardTitle>
        <CardDescription>
          List of all motorcycle models and their availability.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Model</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  No motorcycles in inventory. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              inventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.model}</TableCell>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell className="text-right font-medium">{item.stock}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
