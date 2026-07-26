"use client";

import { QRCodeSVG } from "qrcode.react";

import { cn } from "@/lib/utils";

/**
 * Etiqueta que se imprime y se pega en la puerta de la habitación.
 *
 * El QR codifica el `qr_code` (UUID) tal cual, sin URL ni prefijo: la app móvil
 * lo manda al backend en `room_qr` y este lo resuelve a la pieza. Meter una URL
 * ataría las etiquetas ya pegadas al dominio de turno.
 *
 * Nivel de corrección "H" (el más alto): son etiquetas que van a vivir años en
 * la puerta de un campamento minero, expuestas a polvo y roce, y tienen que
 * seguir leyéndose con parte de la superficie dañada.
 */
export function DoorLabel({
  numero,
  campNombre,
  qrCode,
  className,
}: {
  numero: string;
  campNombre: string;
  qrCode: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border-2 border-black bg-white p-4 text-black",
        // `break-inside-avoid` evita que una etiqueta quede partida entre dos
        // hojas al imprimir el pliego completo de un camp.
        "break-inside-avoid",
        className,
      )}
    >
      <p className="text-center text-xs font-semibold tracking-wide uppercase">
        {campNombre}
      </p>
      <p className="text-center text-4xl leading-none font-bold tabular-nums">
        {numero}
      </p>
      <QRCodeSVG value={qrCode} size={148} level="H" marginSize={2} />
      <p className="text-center font-mono text-[9px] break-all text-neutral-500">
        {qrCode}
      </p>
      <p className="text-center text-[10px] text-neutral-600">
        Escanear al entregar la ropa limpia
      </p>
    </div>
  );
}
