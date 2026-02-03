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
import { DeleteMotorcycleDialog } from "./delete-motorcycle-dialog";

interface InventoryTableProps {
  inventory: Motorcycle[];
  onInventoryUpdated: () => void;
}

export function InventoryTable({ inventory, onInventoryUpdated }: InventoryTableProps) {
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
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No motorcycles in inventory. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              inventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.model}</TableCell>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell className="text-right font-medium">{item.stock}</TableCell>
                  <TableCell className="text-center">
                    <DeleteMotorcycleDialog 
                      motorcycleId={item.id}
                      motorcycleModel={item.model}
                      onMotorcycleDeleted={onInventoryUpdated}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
