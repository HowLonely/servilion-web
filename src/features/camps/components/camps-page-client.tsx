"use client";

import { useState } from "react";
import { DoorClosed, Tent } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CampsTable } from "@/features/camps/components/camps-table";
import { RoomsTable } from "@/features/camps/components/rooms-table";

export function CampsPageClient() {
  const [tab, setTab] = useState("camps");
  const [campId, setCampId] = useState<number | undefined>();

  return (
    <Tabs value={tab} onValueChange={setTab} className="gap-6">
      <TabsList variant="line">
        <TabsTrigger value="camps">
          <Tent />
          Campamentos
        </TabsTrigger>
        <TabsTrigger value="rooms">
          <DoorClosed />
          Habitaciones
        </TabsTrigger>
      </TabsList>

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
