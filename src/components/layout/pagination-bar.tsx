import { Button } from "@/components/ui/button";

/**
 * Barra "Anterior / Siguiente" para listados paginados por offset. El total
 * viene del backend (`count`); nunca se pagina en el cliente sobre datos ya
 * truncados.
 */
export function PaginationBar({
  offset,
  pageSize,
  total,
  itemLabel,
  onOffsetChange,
}: {
  offset: number;
  pageSize: number;
  total: number;
  itemLabel: string;
  onOffsetChange: (offset: number) => void;
}) {
  const shownFrom = total === 0 ? 0 : offset + 1;
  const shownTo = Math.min(offset + pageSize, total);

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        {shownFrom}–{shownTo} de {total.toLocaleString("es-CL")} {itemLabel}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={offset === 0}
          onClick={() => onOffsetChange(Math.max(0, offset - pageSize))}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={shownTo >= total}
          onClick={() => onOffsetChange(offset + pageSize)}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
