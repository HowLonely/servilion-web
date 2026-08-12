import { CreateBatchForm } from "@/features/hospitality/components/create-batch-form";

export default function NewBatchPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Recibir carga de lencería</h1>
        <p className="text-sm text-muted-foreground">
          Registra qué lencería llegó del campamento y cuánta. Esa cantidad es
          contra la que se contará la salida para obtener la merma.
        </p>
      </div>
      <CreateBatchForm />
    </div>
  );
}
