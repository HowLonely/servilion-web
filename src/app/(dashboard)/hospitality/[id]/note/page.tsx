import { BatchNote } from "@/features/hospitality/components/batch-note";

export default async function BatchNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="flex flex-col gap-6">
      <div className="print:hidden">
        <h1 className="text-2xl font-semibold">Acta de devolución</h1>
        <p className="text-sm text-muted-foreground">
          Documento que acompaña la carga limpia de vuelta a faena y que el
          encargado del campamento revisa y firma.
        </p>
      </div>
      <BatchNote batchId={Number(id)} />
    </div>
  );
}
