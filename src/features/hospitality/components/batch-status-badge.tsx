import { cn } from "@/lib/utils";
import {
  BATCH_STATUS_LABELS,
  BATCH_STATUS_TONES,
  type BatchStatus,
} from "@/features/hospitality/lib/status";

export function BatchStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const key = status as BatchStatus;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        BATCH_STATUS_TONES[key] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {BATCH_STATUS_LABELS[key] ?? status}
    </span>
  );
}
