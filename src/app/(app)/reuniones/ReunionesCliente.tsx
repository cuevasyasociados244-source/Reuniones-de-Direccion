"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  cancelarReunion,
  agregarTemaRecurrente,
  quitarTemaRecurrente,
  actualizarFrecuenciaTemaRecurrente,
} from "@/lib/acciones/reuniones";

export type ProximaVM = { id: number; titulo: string; fecha: string; hora: string; agendaCount: number; asistentesCount: number; estado: string };
export type HistorialVM = { id: number; titulo: string; fecha: string; compromisosCount: number; asistentesCount: number };
export type TemplateVM = { id: string; titulo: string; frecuencia: string };
export type MinutaVM = { id: string; meetingTitulo: string; fecha: string; notas: string; riesgos: string };

const ESTADO: Record<string, { txt: string; bg: string; color: string }> = {
  NO_INICIADA: { txt: "No iniciada", bg: "#f1f5f9", color: "#64748b" },
  PROGRESO: { txt: "En progreso", bg: "#e6edfd", color: "#2563eb" },
  REALIZADA: { txt: "Realizada", bg: "#e7f6ec", color: "#16a34a" },
};

const FREQS = [
  ["SEMANAL", "Semanal"], ["MENSUAL", "Mensual"], ["TRIMESTRAL", "Trimestral"],
  ["SEMESTRAL", "Semestral"], ["ANUAL", "Anual"],
] as const;

export default function ReunionesCliente({
  proximas,
  historial,
  templates,
  minutas,
}: {
  proximas: ProximaVM[];
  historial: HistorialVM[];
  templates: TemplateVM[];
  minutas: MinutaVM[];
}) {
  const [tab, setTab] = useState<"proximas" | "historial" | "calendario" | "minutas">("proximas");

  return (
    <div>
      <div className="flex gap-1 border-b border-gray-200 mb-5 flex-wrap">
        {([["proximas", `Próximas (${proximas.length})`], ["historial", `Historial (${historial.length})`], ["calendario", "Calendario"], ["minutas", `Minutas (${minutas.length})`]] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition ${tab === k ? "border-info text-info" : "border-transparent text-gray-500 hover:text-gray-800"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "proximas" && <Proximas proximas={proximas} />}
      {tab === "historial" && <Historial historial={historial} />}
      {tab === "calendario" && <Calendario templates={templates} />}
      {tab === "minutas" && <Minutas minutas={minutas} />}
    </div>
  );
}

function Proximas({ proximas }: { proximas: ProximaVM[] }) {
  if (proximas.length === 0) return <p className="text-sm text-gray-500">No hay reuniones programadas.</p>;
  return (
    <div className="space-y-3">
      {proximas.map((r) => (
        <div key={r.id} className="rounded-card border border-gray-200 bg-white p-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <Link href={`/reuniones/${r.id}`} className="font-semibold text-gray-900 hover:text-info">{r.titulo}</Link>
            <div className="text-xs text-gray-400 mt-0.5">{r.fecha}{r.hora ? ` · ${r.hora}` : ""} · {r.agendaCount} temas · {r.asistentesCount} asistentes</div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: ESTADO[r.estado].bg, color: ESTADO[r.estado].color }}>{ESTADO[r.estado].txt}</span>
            <Link href={`/reuniones/${r.id}`} className="text-xs font-semibold text-info hover:underline">Abrir</Link>
            <CancelarBtn id={r.id} />
          </div>
        </div>
      ))}
    </div>
  );
}

function CancelarBtn({ id }: { id: number }) {
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  if (!confirm) return <button onClick={() => setConfirm(true)} className="text-xs font-semibold text-danger hover:underline">Cancelar</button>;
  return (
    <span className="flex items-center gap-2">
      <span className="text-xs text-gray-500">¿Seguro?</span>
      <button disabled={pending} onClick={() => start(async () => { await cancelarReunion(id); })} className="text-xs font-semibold text-danger hover:underline disabled:opacity-50">Sí</button>
      <button onClick={() => setConfirm(false)} className="text-xs text-gray-500 hover:text-gray-700">No</button>
    </span>
  );
}

function Historial({ historial }: { historial: HistorialVM[] }) {
  if (historial.length === 0) return <p className="text-sm text-gray-500">Aún no hay reuniones realizadas.</p>;
  return (
    <div className="space-y-3">
      {historial.map((r) => (
        <div key={r.id} className="rounded-card border border-gray-200 bg-white p-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <Link href={`/reuniones/${r.id}`} className="font-semibold text-gray-900 hover:text-info">{r.titulo}</Link>
            <div className="text-xs text-gray-400 mt-0.5">{r.fecha} · {r.compromisosCount} compromisos generados · {r.asistentesCount} asistentes</div>
          </div>
          <div className="flex items-center gap-3">
            <a href={`/reunion-pdf/${r.id}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-gray-600 hover:underline">PDF</a>
            <Link href={`/reuniones/${r.id}`} className="text-xs font-semibold text-info hover:underline">Ver detalle</Link>
          </div>
        </div>
      ))}
    </div>
  );
}

function Calendario({ templates }: { templates: TemplateVM[] }) {
  const [titulo, setTitulo] = useState("");
  const [frecuencia, setFrecuencia] = useState("MENSUAL");
  const [pending, start] = useTransition();

  return (
    <div className="max-w-2xl">
      <p className="text-xs text-gray-400 mb-4">Temas recurrentes que suelen aparecer en la agenda de las reuniones de dirección.</p>

      <div className="space-y-2 mb-6">
        {templates.map((t) => (
          <div key={t.id} className="rounded-card border border-gray-200 bg-white p-3 flex items-center justify-between gap-3">
            <span className="text-sm text-gray-800">{t.titulo}</span>
            <div className="flex items-center gap-3">
              <select
                value={t.frecuencia}
                onChange={(e) => start(async () => { await actualizarFrecuenciaTemaRecurrente(t.id, e.target.value); })}
                className="rounded-lg border border-gray-200 px-2 py-1 text-xs bg-white"
              >
                {FREQS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <button onClick={() => start(async () => { await quitarTemaRecurrente(t.id); })} className="text-danger text-lg leading-none" title="Quitar">×</button>
            </div>
          </div>
        ))}
        {templates.length === 0 && <p className="text-sm text-gray-500">No hay temas recurrentes.</p>}
      </div>

      <div className="rounded-card border border-gray-200 bg-gray-50 p-4 flex items-end gap-2 flex-wrap">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">Nuevo tema recurrente</label>
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="ej. Revisión de KPIs" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:border-info focus:outline-none" />
        </div>
        <select value={frecuencia} onChange={(e) => setFrecuencia(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white">
          {FREQS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button
          disabled={pending || !titulo.trim()}
          onClick={() => start(async () => { await agregarTemaRecurrente(titulo, frecuencia); setTitulo(""); })}
          className="rounded-lg bg-info px-4 py-2 text-sm font-semibold text-white hover:bg-info-dark disabled:opacity-50"
        >
          Agregar
        </button>
      </div>
    </div>
  );
}

function Minutas({ minutas }: { minutas: MinutaVM[] }) {
  if (minutas.length === 0) return <p className="text-sm text-gray-500">Aún no se ha archivado ninguna minuta. Usa «Archivar en historial de minutas» dentro de una reunión.</p>;
  return (
    <div className="space-y-3">
      {minutas.map((m) => (
        <div key={m.id} className="rounded-card border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold text-gray-900 text-sm">{m.meetingTitulo}</span>
            <span className="text-xs text-gray-400">{m.fecha}</span>
          </div>
          {m.notas && <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{m.notas}</p>}
          {m.riesgos && (
            <div className="mt-2">
              <div className="text-[11px] font-semibold text-danger">Riesgos y problemas</div>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{m.riesgos}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
