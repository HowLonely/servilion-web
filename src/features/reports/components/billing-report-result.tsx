import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// El backend no documenta un schema estricto para el resultado agregado
// (BillingReportResultOut.result es un objeto abierto), así que se renderiza
// de forma genérica: valores escalares como resumen, y el primer arreglo de
// objetos encontrado (los totales por trabajador) como tabla.
export function BillingReportResult({ result }: { result: Record<string, unknown> }) {
  const scalarEntries = Object.entries(result).filter(
    ([, value]) => typeof value !== "object" || value === null,
  );
  const arrayEntry = Object.entries(result).find(
    ([, value]) => Array.isArray(value) && value.length > 0,
  );

  const rows = (arrayEntry?.[1] as Array<Record<string, unknown>> | undefined) ?? [];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div className="flex flex-col gap-4">
      {scalarEntries.length > 0 && (
        <div className="flex flex-wrap gap-4 text-sm">
          {scalarEntries.map(([key, value]) => (
            <div key={key} className="rounded-md border px-3 py-2">
              <div className="text-xs text-muted-foreground">{key}</div>
              <div className="font-medium">{String(value)}</div>
            </div>
          ))}
        </div>
      )}

      {rows.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column}>{column}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={column}>{String(row[column] ?? "—")}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {rows.length === 0 && scalarEntries.length === 0 && (
        <p className="text-sm text-muted-foreground">
          El reporte no arrojó datos para el rango seleccionado.
        </p>
      )}
    </div>
  );
}
