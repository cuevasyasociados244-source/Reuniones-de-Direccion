"use client";

import { useState, useTransition } from "react";
import {
  capturarAvance,
  crearCompromiso,
  type CompromisoState,
} from "@/lib/acciones/compromisos";
import { useActionState } from "react";
import ResultadoModal from "@/components/ResultadoModal";

export type CompromisoVM = {
  id: number;
  titulo: string;
  descripcion: string;
  area: string;
  responsableId: string;
  responsableNombre: string;
  vence: string; // ya formateado (ej. "30 ago 2026")
  avance: number;
  estado: "NO_INICIADO" | "PROGRESO" | "COMPLETADO" | "VENCIDO";
  indicador: string;
  prioridad: "ALTA" | "MEDIA" | "BAJA";
};

export type PersonaMin = { id: string; nombre: string };

const ESTADO = {
  NO_INICIADO: { txt: "No iniciado", bg: "#f1f5f9", color: "#64748b" },
  PROGRESO: { txt: "En progreso", bg: "#e6edfd", color: "#2563eb" },
  COMPLETADO: { txt: "Completado", bg: "#e7f6ec", color: "#16a34a" },
  VENCIDO: { txt: "Vencido", bg: "#fde9e9", color: "#dc2626" },
} as const;

const PRIORIDAD = {
  ALTA: { txt: "Alta", color: "#dc2626" },
  MEDIA: { txt: "Media", color: "#d97706" },
  BAJA: { txt: "Baja", color: "#16a34a" },
} as const;

export default function CompromisosCliente({
  esGlobal,
  currentUserId,
  todos,
  mios,
  personas,
  departamentos,
}: {
  esGlobal: boolean;
  currentUserId: string;
  todos: CompromisoVM[];
  mios: CompromisoVM[];
  personas: PersonaMin[];
  departamentos: string[];
}) {
  const [tab, setTab] = useState<"tablero" | "mis">(esGlobal ? "tablero" : "mis");
  const [crear, setCrear] = useState(false);
  const [filtro, setFiltro] = useState("");
  const [resultadoFor, setResultadoFor] = useState<CompromisoVM | null>(null);

  const base = filtro ? todos.filter((c) => c.responsableId === filtro) : todos;
  const enTiempo = base.filter((c) => c.estado === "PROGRESO");
  const proximos = base.filter((c) => c.estado === "NO_INICIADO");
  const vencidos = base.filter((c) => c.estado === "VENCIDO");

  return (
    <div>
      <header className="mb-4 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Compromisos</h1>
          <p className="text-sm text-gray-500">
            Claridad y responsabilidad: cada compromiso tiene objetivo, indicador y dueño.
          </p>
        </div>
        {esGlobal && (
          <button
            onClick={() => setCrear((v) => !v)}
            className="rounded-lg bg-info px-4 py-2 text-sm font-semibold text-white hover:bg-info-dark transition"
          >
            {crear ? "Cerrar" : "+ Crear compromiso"}
          </button>
        )}
      </header>

      {crear && esGlobal && (
        <CrearForm
          personas={personas}
          departamentos={departamentos}
          onDone={() => setCrear(false)}
        />
      )}

      <div className="flex gap-1 border-b border-gray-200 mb-5">
        {esGlobal && (
          <TabBtn activo={tab === "tablero"} onClick={() => setTab("tablero")}>
            Tablero de seguimiento
          </TabBtn>
        )}
        <TabBtn activo={tab === "mis"} onClick={() => setTab("mis")}>
          Mis compromisos
        </TabBtn>
      </div>

      {esGlobal && tab === "tablero" && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <label className="text-xs font-semibold text-gray-500">Ver compromisos de:</label>
            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm bg-white min-w-[200px]"
            >
              <option value="">Todos los usuarios</option>
              {personas.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Columna titulo="En tiempo" sub="Van según lo planeado" color="#2563eb" items={enTiempo} currentUserId={currentUserId} />
            <Columna titulo="Próximos a vencer" sub="Aún no iniciados" color="#16a34a" items={proximos} currentUserId={currentUserId} />
            <Columna titulo="Vencidos" sub="Requieren atención inmediata" color="#dc2626" items={vencidos} currentUserId={currentUserId} onRegistrar={setResultadoFor} />
          </div>
        </>
      )}

      {resultadoFor && (
        <ResultadoModal
          compromiso={{ id: resultadoFor.id, titulo: resultadoFor.titulo, vence: resultadoFor.vence }}
          onClose={() => setResultadoFor(null)}
        />
      )}

      {tab === "mis" && (
        <div className="space-y-3">
          {mios.length === 0 && (
            <p className="text-sm text-gray-500">No tienes compromisos asignados.</p>
          )}
          {mios.map((c) => (
            <MiCompromiso key={c.id} c={c} soyResponsable={c.responsableId === currentUserId} />
          ))}
        </div>
      )}
    </div>
  );
}

function TabBtn({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition ${
        activo ? "border-info text-info" : "border-transparent text-gray-500 hover:text-gray-800"
      }`}
    >
      {children}
    </button>
  );
}

function Columna({
  titulo,
  sub,
  color,
  items,
  currentUserId,
  onRegistrar,
}: {
  titulo: string;
  sub: string;
  color: string;
  items: CompromisoVM[];
  currentUserId: string;
  onRegistrar?: (c: CompromisoVM) => void;
}) {
  return (
    <div className="rounded-card border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100" style={{ borderTop: `3px solid ${color}` }}>
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-gray-900 text-sm">{titulo}</h4>
          <span className="text-xs font-bold text-white rounded-full px-2 py-0.5" style={{ background: color }}>
            {items.length}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </div>
      <div className="p-3 space-y-3">
        {items.length === 0 && (
          <p className="text-xs text-gray-400 py-4 text-center">Nada en este grupo por ahora.</p>
        )}
        {items.map((c) => (
          <div key={c.id} className="rounded-lg border border-gray-100 p-3">
            <div className="text-sm font-medium text-gray-900">{c.titulo}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">
              {c.responsableNombre} · vence {c.vence}
            </div>
            <ProgressBar value={c.avance} color={color} />
            {c.responsableId === currentUserId && c.estado !== "VENCIDO" && (
              <AvanceSelector id={c.id} value={c.avance} accent={color} />
            )}
            {onRegistrar && c.estado === "VENCIDO" && (
              <button
                onClick={() => onRegistrar(c)}
                className="mt-2 w-full rounded-md py-1.5 text-[11px] font-semibold text-white transition hover:brightness-95"
                style={{ background: color }}
              >
                Registrar resultado
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MiCompromiso({ c, soyResponsable }: { c: CompromisoVM; soyResponsable: boolean }) {
  const e = ESTADO[c.estado];
  const p = PRIORIDAD[c.prioridad];
  return (
    <div className="rounded-card border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{c.titulo}</span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: e.bg, color: e.color }}>
              {e.txt}
            </span>
          </div>
          {c.descripcion && <p className="text-xs text-gray-500 mt-1">{c.descripcion}</p>}
          <div className="text-[11px] text-gray-400 mt-1">
            {c.area} · vence {c.vence} · prioridad{" "}
            <span style={{ color: p.color, fontWeight: 600 }}>{p.txt}</span>
            {c.indicador && <> · {c.indicador}</>}
          </div>
        </div>
      </div>
      <div className="mt-3 max-w-md">
        <ProgressBar value={c.avance} color={e.color} />
        {soyResponsable && c.estado !== "VENCIDO" && (
          <AvanceSelector id={c.id} value={c.avance} accent="#2563eb" />
        )}
      </div>
    </div>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-[11px] font-bold text-gray-600 w-9 text-right">{value}%</span>
    </div>
  );
}

// Selector de avance: valores fijos 25/50/75/100. Llama al server action.
function AvanceSelector({ id, value, accent }: { id: number; value: number; accent: string }) {
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
    <div className="mt-2">
      <div className="flex gap-1.5">
        {[25, 50, 75, 100].map((op) => {
          const sel = value === op;
          return (
            <button
              key={op}
              type="button"
              disabled={pending}
              onClick={() => set(op)}
              className="flex-1 rounded-md border py-1 text-[11px] font-bold transition disabled:opacity-50"
              style={
                sel
                  ? { background: accent, borderColor: accent, color: "#fff" }
                  : { background: "#fff", borderColor: "#e2e8f0", color: "#64748b" }
              }
            >
              {op}%
            </button>
          );
        })}
      </div>
      {error && <p className="text-[11px] text-danger mt-1">{error}</p>}
    </div>
  );
}

const initial: CompromisoState = {};

function CrearForm({
  personas,
  departamentos,
  onDone,
}: {
  personas: PersonaMin[];
  departamentos: string[];
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(crearCompromiso, initial);

  return (
    <form action={action} className="mb-6 rounded-card border border-gray-200 bg-white p-5 grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-gray-600 mb-1">Título</label>
        <input name="titulo" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-info focus:outline-none" />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
        <textarea name="descripcion" rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-info focus:outline-none" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Área</label>
        <select name="area" defaultValue="" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:border-info focus:outline-none">
          <option value="" disabled>Selecciona…</option>
          {departamentos.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Responsable</label>
        <select name="responsableId" defaultValue="" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:border-info focus:outline-none">
          <option value="" disabled>Selecciona…</option>
          {personas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Fecha de vencimiento</label>
        <input name="vence" type="date" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:border-info focus:outline-none" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Prioridad</label>
        <select name="prioridad" defaultValue="MEDIA" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:border-info focus:outline-none">
          <option value="ALTA">Alta</option>
          <option value="MEDIA">Media</option>
          <option value="BAJA">Baja</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-gray-600 mb-1">Indicador de medición</label>
        <input name="indicador" placeholder="ej. % de reducción, número de quejas…" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-info focus:outline-none" />
      </div>

      {state.error && <p className="sm:col-span-2 text-sm text-danger bg-danger-bg rounded-lg px-3 py-2">{state.error}</p>}
      {state.ok && <p className="sm:col-span-2 text-sm text-success bg-success-bg rounded-lg px-3 py-2">{state.ok}</p>}

      <div className="sm:col-span-2 flex gap-2">
        <button disabled={pending} className="rounded-lg bg-info px-4 py-2 text-sm font-semibold text-white hover:bg-info-dark disabled:opacity-50">
          {pending ? "Creando…" : "Crear compromiso"}
        </button>
        <button type="button" onClick={onDone} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
          Cerrar
        </button>
      </div>
    </form>
  );
}
