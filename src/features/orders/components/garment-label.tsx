"use client";

import { QRCodeSVG } from "qrcode.react";

import { cn } from "@/lib/utils";

/**
 * Etiqueta lavable que se pega a una prenda al digitalizar la OT.
 *
 * El QR codifica `scan_payload` (`P1005-ALM`) tal cual: el ref del morral y el
 * código de la prenda. Un solo disparo en la mesa de empaque abre el morral y
 * marca la prenda, así que el operador no elige modo en pantalla.
 *
 * El ref y el código de prenda impresos en grande son las dos mitades de ese
 * mismo payload: la etiqueta vuelve del lavado rayada o borrosa más seguido de
 * lo que se quisiera, así que si el QR no lee se tipean a mano. Por eso el
 * código de prenda es corto (`ALM`, `X1`) y no un id interno.
 *
 * Nivel de corrección "H" (el más alto): la etiqueta pasa por lavado industrial
 * pegada a la prenda y tiene que seguir leyéndose con parte de la superficie
 * dañada, igual que las de puerta (ver DoorLabel).
 *
 * Una sola etiqueta cubre toda la línea aunque declare varias unidades (ej. 4
 * poleras): las unidades de una misma prenda comparten físicamente el mismo
 * código, así que se pistolea el mismo QR tantas veces como unidades vuelvan.
 */
export function GarmentLabel({
  reference,
  labelCode,
  scanPayload,
  garmentName,
  workerName,
  companyName,
  faena,
  isContractor,
  quantity,
  className,
}: {
  reference: string;
  labelCode: string;
  scanPayload: string;
  garmentName: string;
  workerName: string;
  companyName: string;
  faena: string;
  isContractor: boolean;
  quantity: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-xl border-2 border-black bg-white p-3 text-black",
        // Evita que una etiqueta quede partida entre dos hojas al imprimir el
        // pliego completo de la OT.
        "break-inside-avoid",
        className,
      )}
    >
      {/* Faena y empresa: ubican la prenda si la etiqueta se despega y aparece
          suelta, pero no compiten con el ref.

          La palabra "Contratista" va en negro sobre la línea gris porque es lo
          único de esta franja que cambia una decisión: dice que el morral no es
          del mandante de la faena aunque se lave y se facture bajo su cliente. */}
      <div className="flex w-full items-baseline justify-center gap-1 text-[9px] leading-none font-semibold tracking-[0.12em] uppercase">
        {/* `min-w-0` + `truncate` en la faena/empresa y `shrink-0` en la marca:
            si el nombre no cabe se corta el nombre, nunca la palabra que dice
            que el morral es de una contratista. */}
        <p className="min-w-0 truncate text-neutral-500">
          {[faena, companyName].filter(Boolean).join(" · ") || "—"}
        </p>
        {isContractor && (
          <span className="shrink-0 font-black text-black">· Contratista</span>
        )}
      </div>

      {/* El ref y el código de prenda son lo que se lee de lejos entre las
          prendas sueltas de la mesa, así que van juntos y en el mayor tamaño
          que permite el adhesivo: el ref identifica el morral y el badge, qué
          prenda es. Ambos se tipean si el QR vuelve ilegible del lavado. */}
      <div className="flex w-full items-center justify-center gap-1.5">
        <p className="text-3xl leading-none font-black tracking-tight tabular-nums">
          {reference || "S/REF"}
        </p>
        <p className="rounded bg-black px-1.5 py-1 font-mono text-sm leading-none font-bold text-white">
          {labelCode}
        </p>
      </div>

      <QRCodeSVG value={scanPayload} size={100} level="H" marginSize={2} />

      {/* Nombre de la prenda: confirma a simple vista que el badge corresponde
          a lo que se tiene en la mano (`ALM` → almohada). */}
      <p className="w-full truncate text-center text-[11px] leading-none font-bold uppercase">
        {garmentName}
        {quantity > 1 && (
          <span className="tabular-nums font-black"> ×{quantity}</span>
        )}
      </p>
      <p className="w-full truncate text-center text-[9px] leading-none text-neutral-500">
        {workerName}
      </p>
    </div>
  );
}
