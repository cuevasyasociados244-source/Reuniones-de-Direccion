"use client";

import { useState, useTransition } from "react";
import {
  actualizarEstadoTema,
  actualizarEstadoReunion,
  guardarMinutaTrabajo,
  archivarMinuta,
  guardarEnHistorial,
  toggleAsistente,
  crearCompromisoEnReunion,
} from "@/lib/acciones/reuniones";

type AgendaVM = { id: number; titulo: string; descripcion: string; duracion: number; estado: string };
type CompromisoVM = { id: number; titulo: string; responsableNombre: string; vence: string; estado: string };
export type ReunionVM = {
  id: number;
  titulo: string;
  fecha: string;
  hora: string;
  lugar: string;
  tipo: string;
  frecuencia: string;
  estado: string;
  objetivo: string;
  notas: string;
  riesgos: string;
  minutasCount: number;
  agenda: AgendaVM[];
  asistentesIds: string[];
  compromisos: CompromisoVM[];
};
type Persona = { id: string; nombre: string; puesto: string };

const TEMA_ESTILO: Record<string, { bg: string; color: string }> = {
  NO_INICIADO: { bg: "#f1f5f9", color: "#64748b" },
  PROGRESO: { bg: "#e6edfd", color: "#2563eb" },
  COMPLETADO: { bg: "#e7f6ec", color: "#16a34a" },
};

export default function ReunionDetalle({
  reunion,
  personas,
  departamentos,
}: {
  reunion: ReunionVM;
  personas: Persona[];
  departamentos: string[];
}) {
  const [tab, setTab] = useState<"agenda" | "compromisos" | "minuta" | "asistentes">("agenda");
  const [pending, start] = useTransition();

  const completados = reunion.agenda.filter((a) => a.estado === "COMPLETADO").length;
  const pctAgenda = reunion.agenda.length ? Math.round((completados / reunion.agenda.length) * 100) : 0;

  return (
    <div className="mt-2">
      <header className="mb-5 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{reunion.titulo}</h1>
          <p className="text-sm text-gray-500">
            {reunion.fecha}{reunion.hora ? ` · ${reunion.hora}` : ""}{reunion.lugar ? ` · ${reunion.lugar}` : ""}
          </p>
          {reunion.objetivo && <p className="text-xs text-gray-400 mt-1 max-w-xl">{reunion.objetivo}</p>}
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/reunion-pdf/${reunion.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Descargar PDF
          </a>
          <select
            value={reunion.estado}
            disabled={pending}
            onChange={(e) => start(async () => { await actualizarEstadoReunion(reunion.id, e.target.value); })}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm bg-white"
          >
            <option value="NO_INICIADA">No iniciada</option>
            <option value="PROGRESO">En progreso</option>
            <option value="REALIZADA">Realizada</option>
          </select>
        </div>
      </header>

      <div className="flex gap-1 border-b border-gray-200 mb-5 flex-wrap">
        {([["agenda", "Agenda"], ["compromisos", "Compromisos"], ["minuta", "Minuta"], ["asistentes", "Asistentes"]] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition ${tab === k ? "border-info text-info" : "border-transparent text-gray-500 hover:text-gray-800"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "agenda" && <TabAgenda reunion={reunion} pctAgenda={pctAgenda} />}
      {tab === "compromisos" && <TabCompromisos reunion={reunion} personas={personas} departamentos={departamentos} />}
      {tab === "minuta" && <TabMinuta reunion={reunion} />}
      {tab === "asistentes" && <TabAsistentes reunion={reunion} personas={personas} />}
    </div>
  );
}

function TabAgenda({ reunion, pctAgenda }: { reunion: ReunionVM; pctAgenda: number }) {
  const [pending, start] = useTransition();
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden max-w-xs">
          <div className="h-full rounded-full bg-success" style={{ width: `${pctAgenda}%` }} />
        </div>
        <span className="text-xs font-semibold text-gray-600">{pctAgenda}% de la agenda completada</span>
      </div>
      <div className="space-y-2">
        {reunion.agenda.map((a) => {
          const s = TEMA_ESTILO[a.estado] ?? TEMA_ESTILO.NO_INICIADO;
          return (
            <div key={a.id} className="rounded-card border border-gray-200 bg-white p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900">{a.titulo}</div>
                {a.descripcion && <div className="text-xs text-gray-400">{a.descripcion}</div>}
                {a.duracion > 0 && <div className="text-[11px] text-gray-400">{a.duracion} min</div>}
              </div>
              <select
                value={a.estado}
                disabled={pending}
                onChange={(e) => start(async () => { await actualizarEstadoTema(a.id, e.target.value); })}
                className="rounded-full px-3 py-1 text-xs font-semibold border-none outline-none"
                style={{ background: s.bg, color: s.color }}
              >
                <option value="NO_INICIADO">No iniciado</option>
                <option value="PROGRESO">En progreso</option>
                <option value="COMPLETADO">Completado</option>
              </select>
            </div>
          );
        })}
        {reunion.agenda.length === 0 && <p className="text-sm text-gray-500">Esta reunión no tiene temas de agenda.</p>}
      </div>
    </div>
  );
}

function TabCompromisos({ reunion, personas, departamentos }: { reunion: ReunionVM; personas: Persona[]; departamentos: string[] }) {
  const [crear, setCrear] = useState(false);
  const resumen = [
    { label: "Completados", n: reunion.compromisos.filter((c) => c.estado === "COMPLETADO").length, color: "#16a34a" },
    { label: "En proceso", n: reunion.compromisos.filter((c) => c.estado === "PROGRESO").length, color: "#2563eb" },
    { label: "Pendientes", n: reunion.compromisos.filter((c) => c.estado === "NO_INICIADO").length, color: "#64748b" },
    { label: "Vencidos", n: reunion.compromisos.filter((c) => c.estado === "VENCIDO").length, color: "#dc2626" },
  ];
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {resumen.map((r) => (
          <div key={r.label} className="rounded-card border border-gray-200 bg-white p-3 text-center">
            <div className="text-2xl font-extrabold" style={{ color: r.color }}>{r.n}</div>
            <div className="text-xs text-gray-500">{r.label}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Compromisos de esta reunión</h3>
        <button onClick={() => setCrear((v) => !v)} className="text-xs font-semibold text-info hover:underline">
          {crear ? "Cerrar" : "+ Crear compromiso"}
        </button>
      </div>

      {crear && <CrearCompromisoReunion reunionId={reunion.id} personas={personas} departamentos={departamentos} onDone={() => setCrear(false)} />}

      <div className="space-y-2">
        {reunion.compromisos.map((c) => (
          <div key={c.id} className="rounded-card border border-gray-200 bg-white p-3">
            <div className="text-sm font-medium text-gray-900">{c.titulo}</div>
            <div className="text-[11px] text-gray-400">{c.responsableNombre} · vence {c.vence}</div>
          </div>
        ))}
        {reunion.compromisos.length === 0 && <p className="text-sm text-gray-500">Aún no se han generado compromisos en esta reunión.</p>}
      </div>
    </div>
  );
}

function CrearCompromisoReunion({ reunionId, personas, departamentos, onDone }: { reunionId: number; personas: Persona[]; departamentos: string[]; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({ titulo: "", descripcion: "", area: "", responsableId: "", vence: "", indicador: "", prioridad: "MEDIA" });
  const set = (patch: Partial<typeof f>) => setF((prev) => ({ ...prev, ...patch }));
  const inp = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-info focus:outline-none";

  function guardar() {
    setError(null);
    start(async () => {
      const r = await crearCompromisoEnReunion(reunionId, f);
      if (r.error) setError(r.error);
      else onDone();
    });
  }

  return (
    <div className="mb-4 rounded-card border border-gray-200 bg-gray-50 p-4 grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <input value={f.titulo} onChange={(e) => set({ titulo: e.target.value })} placeholder="Título" className={inp} />
      </div>
      <select value={f.area} onChange={(e) => set({ area: e.target.value })} className={`${inp} bg-white`}>
        <option value="">Área…</option>
        {departamentos.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>
      <select value={f.responsableId} onChange={(e) => set({ responsableId: e.target.value })} className={`${inp} bg-white`}>
        <option value="">Responsable…</option>
        {personas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
      </select>
      <input type="date" value={f.vence} onChange={(e) => set({ vence: e.target.value })} className={`${inp} bg-white`} />
      <select value={f.prioridad} onChange={(e) => set({ prioridad: e.target.value })} className={`${inp} bg-white`}>
        <option value="ALTA">Alta</option>
        <option value="MEDIA">Media</option>
        <option value="BAJA">Baja</option>
      </select>
      <div className="sm:col-span-2">
        <input value={f.indicador} onChange={(e) => set({ indicador: e.target.value })} placeholder="Indicador de medición" className={inp} />
      </div>
      {error && <p className="sm:col-span-2 text-sm text-danger">{error}</p>}
      <div className="sm:col-span-2 flex gap-2">
        <button onClick={guardar} disabled={pending} className="rounded-lg bg-info px-4 py-2 text-sm font-semibold text-white hover:bg-info-dark disabled:opacity-50">
          {pending ? "Creando…" : "Crear"}
        </button>
        <button onClick={onDone} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-white">Cancelar</button>
      </div>
    </div>
  );
}

function TabMinuta({ reunion }: { reunion: ReunionVM }) {
  const [notas, setNotas] = useState(reunion.notas);
  const [riesgos, setRiesgos] = useState(reunion.riesgos);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const inp = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-info focus:outline-none";

  function accion(fn: () => Promise<{ error?: string; ok?: string }>) {
    setMsg(null);
    start(async () => {
      const r = await fn();
      setMsg(r.error ?? r.ok ?? null);
    });
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Notas de la reunión</label>
        <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={5} className={inp} placeholder="Acuerdos, decisiones, temas tratados…" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Riesgos y problemas</label>
        <textarea value={riesgos} onChange={(e) => setRiesgos(e.target.value)} rows={3} className={inp} placeholder="Riesgos identificados y problemas críticos…" />
      </div>

      {msg && <p className="text-sm text-success bg-success-bg rounded-lg px-3 py-2">{msg}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => accion(() => guardarMinutaTrabajo(reunion.id, notas, riesgos))}
          disabled={pending}
          className="rounded-lg bg-info px-4 py-2 text-sm font-semibold text-white hover:bg-info-dark disabled:opacity-50"
        >
          Guardar minuta
        </button>
        <button
          onClick={() => accion(() => archivarMinuta(reunion.id))}
          disabled={pending}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Archivar en historial de minutas ({reunion.minutasCount})
        </button>
        <button
          onClick={() => accion(() => guardarEnHistorial(reunion.id))}
          disabled={pending}
          className="rounded-lg border border-success px-4 py-2 text-sm font-semibold text-success hover:bg-success-bg disabled:opacity-50"
        >
          Guardar en historial (marcar realizada)
        </button>
      </div>
      <p className="text-[11px] text-gray-400">
        «Guardar minuta» guarda las notas en la reunión. «Archivar» crea una copia con fecha en el historial de minutas. «Guardar en historial» marca la reunión como realizada.
      </p>
    </div>
  );
}

function TabAsistentes({ reunion, personas }: { reunion: ReunionVM; personas: Persona[] }) {
  const [pending, start] = useTransition();
  const ids = new Set(reunion.asistentesIds);
  return (
    <div className="max-w-lg">
      <p className="text-xs text-gray-400 mb-3">Marca quién asiste a esta reunión.</p>
      <div className="space-y-1">
        {personas.map((p) => {
          const asiste = ids.has(p.id);
          return (
            <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer rounded-lg px-2 py-1.5 hover:bg-gray-50">
              <input
                type="checkbox"
                checked={asiste}
                disabled={pending}
                onChange={() => start(async () => { await toggleAsistente(reunion.id, p.id, !asiste); })}
              />
              <span className="text-gray-800">{p.nombre}</span>
              <span className="text-xs text-gray-400">· {p.puesto}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
