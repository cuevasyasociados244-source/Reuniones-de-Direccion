"use client";

import { useState, useTransition } from "react";
import { registrarResultado } from "@/lib/acciones/compromisos";

export type CompromisoResultadoVM = {
  id: number;
  titulo: string;
  vence: string;
};

type Resultado = "SI" | "PARCIALMENTE" | "NO";

const OPCIONES: { key: Resultado; label: string; color: string; bg: string }[] = [
  { key: "SI", label: "Sí, se cumplió", color: "#16a34a", bg: "#e7f6ec" },
  { key: "PARCIALMENTE", label: "Parcialmente", color: "#d97706", bg: "#fef3e0" },
  { key: "NO", label: "No se cumplió", color: "#dc2626", bg: "#fde9e9" },
];

export default function ResultadoModal({
  compromiso,
  onClose,
}: {
  compromiso: CompromisoResultadoVM;
  onClose: () => void;
}) {
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [causa, setCausa] = useState("");
  const [accion, setAccion] = useState("");
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const accent = OPCIONES.find((o) => o.key === resultado)?.color ?? "#e2e8f0";

  function guardar() {
    if (!resultado) return;
    setError(null);
    start(async () => {
      const r = await registrarResultado(compromiso.id, {
        resultado,
        causa,
        accionCorrectiva: accion,
        nuevaFecha: nuevaFecha || undefined,
      });
      if (r.error) setError(r.error);
      else onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl flex"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-1.5 shrink-0 transition-colors" style={{ background: accent }} />
        <div className="flex-1 p-6 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-start gap-3 min-w-0">
              <span className="h-9 w-9 shrink-0 rounded-xl bg-brand-tropical flex items-center justify-center text-white font-bold">
                ✓
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-gray-900">Resultado del compromiso</h2>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {compromiso.titulo} · vence {compromiso.vence}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg leading-none">×</button>
          </div>

          <label className="block text-xs font-semibold text-gray-600 mb-2">
            ¿Se cumplió el compromiso?
          </label>
          <div className="flex gap-2 mb-4">
            {OPCIONES.map((o) => {
              const sel = resultado === o.key;
              return (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => setResultado(o.key)}
                  className="flex-1 rounded-lg border py-2 text-xs font-semibold transition"
                  style={
                    sel
                      ? { background: o.bg, borderColor: o.color, color: o.color }
                      : { background: "#fff", borderColor: "#e2e8f0", color: "#64748b" }
                  }
                >
                  {o.label}
                </button>
              );
            })}
          </div>

          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Causa principal del resultado
            </label>
            <textarea
              rows={2}
              value={causa}
              onChange={(e) => setCausa(e.target.value)}
              placeholder="ej. Falta de análisis oportuno en algunas sucursales."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-info focus:outline-none"
            />
          </div>

          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Acción correctiva</label>
            <textarea
              rows={2}
              value={accion}
              onChange={(e) => setAccion(e.target.value)}
              placeholder="ej. Implementar revisión quincenal con responsable por sucursal."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-info focus:outline-none"
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Nueva fecha (si se reprograma)
            </label>
            <input
              type="date"
              value={nuevaFecha}
              onChange={(e) => setNuevaFecha(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:border-info focus:outline-none"
            />
          </div>

          {error && <p className="mb-3 text-sm text-danger bg-danger-bg rounded-lg px-3 py-2">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={!resultado || pending}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: resultado ? accent : "#2563eb" }}
            >
              {pending ? "Guardando…" : "Guardar resultado"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
