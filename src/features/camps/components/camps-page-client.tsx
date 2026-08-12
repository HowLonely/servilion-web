"use client";

import { useState } from "react";
import { DoorClosed, Pickaxe, Tent } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CampsTable } from "@/features/camps/components/camps-table";
import { FaenasTable } from "@/features/camps/components/faenas-table";
import { RoomsTable } from "@/features/camps/components/rooms-table";

export function CampsPageClient() {
  const [tab, setTab] = useState("camps");
  const [campId, setCampId] = useState<number | undefined>();

  return (
    <Tabs value={tab} onValueChange={setTab} className="gap-6">
      <TabsList variant="line">
        {/* El orden refleja la jerarquía física: la faena contiene
            campamentos, y el campamento contiene puertas. */}
        <TabsTrigger value="faenas">
          <Pickaxe />
          Faenas
        </TabsTrigger>
        <TabsTrigger value="camps">
          <Tent />
          Campamentos
        </TabsTrigger>
        <TabsTrigger value="rooms">
          <DoorClosed />
          Habitaciones
        </TabsTrigger>
      </TabsList>

      <TabsContent value="faenas">
        <FaenasTable />
      </TabsContent>
      <TabsContent value="camps">
        <CampsTable
          onVerRooms={(id) => {
            // Saltar con el filtro ya puesto: entrar a "Habitaciones" y volver
            // a elegir el campamento a mano sería repetir el paso anterior.
            setCampId(id);
            setTab("rooms");
          }}
        />
      </TabsContent>
      <TabsContent value="rooms">
        <RoomsTable
          campId={campId}
          onCampChange={setCampId}
        />
      </TabsContent>
    </Tabs>
  );
}
