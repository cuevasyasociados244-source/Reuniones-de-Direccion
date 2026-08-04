"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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
          Consecuencias: toda acción produce un resultado.{" "}
          {esGlobal ? "Haz clic en la dona para actualizar el avance de cualquier compromiso." : "Vista del avance capturado."}
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
              ) : esGlobal ? (
                /* La Dirección: clic en la dona para revelar los botones 25/50/75/100. */
                <AvanceControl id={c.id} value={c.avance} estado={c.estado} />
              ) : (
                <Ring value={c.avance} color={c.estado === "NO_INICIADO" ? "#94a3b8" : "#2563eb"} />
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

// Dona clicable: muestra solo el anillo de avance; al hacer clic revela los
// botones 25/50/75/100 en un popover. Se cierra al elegir un valor o al hacer
// clic fuera del control.
function AvanceControl({ id, value, estado }: { id: number; value: number; estado: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const color = estado === "NO_INICIADO" ? "#94a3b8" : "#2563eb";

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function set(v: number) {
    setError(null);
    start(async () => {
      const r = await capturarAvance(id, v);
      if (r.error) setError(r.error);
      else setOpen(false);
    });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Clic para actualizar el avance"
        className="rounded-full transition hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-info/40"
      >
        <Ring value={value} color={color} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-20 rounded-lg border border-gray-200 bg-white shadow-lg p-2 flex flex-col items-end gap-1">
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
      )}
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
