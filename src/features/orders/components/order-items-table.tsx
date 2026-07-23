import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { components } from "@/lib/api/schema";

type OrderItemOut = components["schemas"]["OrderItemOut"];

export function OrderItemsTable({ items }: { items: OrderItemOut[] }) {
  const totalDeclared = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalScanned = items.reduce((sum, item) => sum + item.scanned_quantity, 0);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Código</TableHead>
          <TableHead>Prenda</TableHead>
          <TableHead>Declaradas</TableHead>
          <TableHead>Pistoleadas</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item, index) => (
          <TableRow key={index}>
            <TableCell className="font-mono text-xs font-semibold tabular-nums">
              {item.code || "—"}
            </TableCell>
            <TableCell>
              <span className="flex items-center gap-2">
                {item.name}
                {/* Prendas que el trabajador escribió a mano en la OT física y
                    no existen en el catálogo preimpreso. */}
                {item.garment_type_id === null && (
                  <Badge variant="outline">Fuera de catálogo</Badge>
                )}
              </span>
            </TableCell>
            <TableCell>{item.quantity}</TableCell>
            <TableCell
              className={
                item.scanned_quantity < item.quantity
                  ? "text-muted-foreground"
                  : undefined
              }
            >
              {item.scanned_quantity}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2}>Total</TableCell>
          <TableCell>{totalDeclared}</TableCell>
          <TableCell>{totalScanned}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
