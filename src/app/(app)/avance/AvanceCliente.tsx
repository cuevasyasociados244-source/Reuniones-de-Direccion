"use client";

import { useState, useTransition } from "react";
import ResultadoModal from "@/components/ResultadoModal";
import { capturarAvance } from "@/lib/acciones/compromisos";

export type AvanceVM = {
  id: number;
  titulo: string;
  responsableId: string;
  responsableNombre: string;
  vence: string;
  avance: number;
  estado: "NO_INICIADO" | "PROGRESO" | "COMPLETADO" | "VENCIDO";
};
export type PersonaMin = { id: string; nombre: string };

export default function AvanceCliente({
  esGlobal,
  compromisos,
  candidatos,
}: {
  esGlobal: boolean;
  compromisos: AvanceVM[];
  candidatos: PersonaMin[];
}) {
  const [filtro, setFiltro] = useState("");
  const [resultadoFor, setResultadoFor] = useState<AvanceVM | null>(null);

  const lista = filtro ? compromisos.filter((c) => c.responsableId === filtro) : compromisos;

  return (
    <div>
      <header className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">Avance de Compromisos</h1>
        <p className="text-sm text-gray-500">
          Consecuencias: toda acción produce un resultado. Vista de solo lectura del avance capturado.
        </p>
      </header>

      {candidatos.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <label className="text-xs font-semibold text-gray-500">Ver avance de:</label>
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm bg-white min-w-[200px]"
          >
            <option value="">Todos los usuarios</option>
            {candidatos.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>
      )}

      <div className="rounded-card border border-gray-200 bg-white divide-y divide-gray-100">
        {lista.length === 0 && (
          <p className="px-5 py-6 text-sm text-gray-400">No hay resultados que reportar en tu alcance por ahora.</p>
        )}
        {lista.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-900">{c.titulo}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                {c.responsableNombre} · {c.estado === "VENCIDO" ? "venció" : "vence"} {c.vence}
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              {c.estado === "VENCIDO" ? (
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "#fde9e9", color: "#dc2626" }}>
                  Vencido
                </span>
              ) : (
                <Ring value={c.avance} color={c.estado === "NO_INICIADO" ? "#94a3b8" : "#2563eb"} />
              )}
              {/* La Dirección puede fijar el avance de cualquier compromiso desde aquí. */}
              {esGlobal && c.estado !== "VENCIDO" && (
                <AvanceSelector id={c.id} value={c.avance} />
              )}
              {esGlobal && (
                <button
                  onClick={() => setResultadoFor(c)}
                  className="rounded-lg bg-info px-3 py-1.5 text-xs font-semibold text-white hover:bg-info-dark shrink-0"
                >
                  Registrar resultado
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {resultadoFor && (
        <ResultadoModal
          compromiso={{ id: resultadoFor.id, titulo: resultadoFor.titulo, vence: resultadoFor.vence }}
          onClose={() => setResultadoFor(null)}
        />
      )}
    </div>
  );
}

function AvanceSelector({ id, value }: { id: number; value: number }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  function set(v: number) {
    setError(null);
    start(async () => {
      const r = await capturarAvance(id, v);
      if (r.error) setError(r.error);
    });
  }
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1">
        {[25, 50, 75, 100].map((op) => {
          const sel = value === op;
          return (
            <button
              key={op}
              type="button"
              disabled={pending}
              onClick={() => set(op)}
              className="rounded-md border px-2 py-1 text-[11px] font-bold transition disabled:opacity-50"
              style={sel ? { background: "#2563eb", borderColor: "#2563eb", color: "#fff" } : { background: "#fff", borderColor: "#e2e8f0", color: "#64748b" }}
            >
              {op}%
            </button>
          );
        })}
      </div>
      {error && <span className="text-[10px] text-danger">{error}</span>}
    </div>
  );
}

function Ring({ value, color, size = 46, stroke = 5 }: { value: number; color: string; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(100, value)) / 100);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold text-gray-900">
        {value}%
      </span>
    </div>
  );
}
