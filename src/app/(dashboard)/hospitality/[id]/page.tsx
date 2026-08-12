import { BatchDetailView } from "@/features/hospitality/components/batch-detail-view";

export default async function BatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BatchDetailView batchId={Number(id)} />;
}
