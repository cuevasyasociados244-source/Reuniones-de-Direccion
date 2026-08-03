"use client";

import { useState, useTransition } from "react";
import {
  crearDepartamento,
  quitarDepartamento,
  crearKpi,
  actualizarKpi,
  eliminarKpi,
  sincronizarKpis,
  type KpiInput,
} from "@/lib/acciones/configuracion";

export type DeptVM = { id: string; nombre: string };
export type KpiRowVM = KpiInput & { id: number; estado: string; responsableNombre: string };
export type PersonaMin = { id: string; nombre: string };

const ESTADO: Record<string, { txt: string; color: string }> = {
  OBJETIVO: { txt: "En objetivo", color: "#16a34a" },
  RIESGO: { txt: "En riesgo", color: "#d97706" },
  FUERA: { txt: "Fuera", color: "#dc2626" },
};
const METODO: Record<string, string> = { MANUAL: "Manual", GOOGLE_SHEETS: "Google Sheets", ERP: "ERP" };

export default function ConfiguracionCliente({
  departamentos,
  departamentosNombres,
  kpis,
  personas,
  googleSheetsCount,
}: {
  departamentos: DeptVM[];
  departamentosNombres: string[];
  kpis: KpiRowVM[];
  personas: PersonaMin[];
  googleSheetsCount: number;
}) {
  const [kpiModal, setKpiModal] = useState<{ mode: "nuevo" } | { mode: "editar"; kpi: KpiRowVM } | null>(null);

  return (
    <div className="max-w-4xl">
      <header className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-500">Departamentos, indicadores y ajustes generales.</p>
      </header>

      <Departamentos departamentos={departamentos} />

      <section className="rounded-card border border-gray-200 bg-white p-5 mb-5">
        <h3 className="text-sm font-semibold text-gray-900">Gestión de KPIs</h3>
        <p className="text-xs text-gray-500 mt-1 mb-3">
          Agrega, edita o elimina los indicadores del módulo Indicadores (KPIs). Los cambios se reflejan de inmediato en el tablero.
        </p>

        <SyncBar googleSheetsCount={googleSheetsCount} />

        <div className="mt-4 divide-y divide-gray-100">
          {kpis.map((k) => (
            <div key={k.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {k.nombre} <span className="text-xs text-gray-400">· {k.codigo}</span>
                  {!k.activo && <span className="ml-2 text-[10px] text-gray-400">(inactivo)</span>}
                </div>
                <div className="text-[11px] text-gray-400">
                  {k.area} · {k.pct}% · {METODO[k.metodoCaptura] ?? k.metodoCaptura}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: ESTADO[k.estado]?.color ?? "#94a3b8" }} title={ESTADO[k.estado]?.txt} />
                <button onClick={() => setKpiModal({ mode: "editar", kpi: k })} className="text-xs font-semibold text-gray-600 hover:text-gray-900">Editar</button>
                <EliminarKpiBtn id={k.id} />
              </div>
            </div>
          ))}
          {kpis.length === 0 && <p className="text-sm text-gray-400 py-3">No hay KPIs registrados.</p>}
        </div>

        <button onClick={() => setKpiModal({ mode: "nuevo" })} className="mt-4 rounded-lg bg-info px-4 py-2 text-sm font-semibold text-white hover:bg-info-dark">
          + Agregar KPI
        </button>
      </section>

      <section className="rounded-card border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Otros ajustes</h3>
        <div className="text-sm text-gray-700 py-2 border-b border-gray-100">
          Plantillas de agenda <span className="text-xs text-gray-400">· se gestionan en Reuniones → Calendario</span>
        </div>
        <div className="text-sm text-gray-700 py-2">
          Notificaciones y recordatorios <span className="text-xs text-gray-400">· pendiente</span>
        </div>
      </section>

      {kpiModal && (
        <KpiModal
          modo={kpiModal.mode}
          kpi={kpiModal.mode === "editar" ? kpiModal.kpi : undefined}
          personas={personas}
          departamentos={departamentosNombres}
          onClose={() => setKpiModal(null)}
        />
      )}
    </div>
  );
}

function Departamentos({ departamentos }: { departamentos: DeptVM[] }) {
  const [nuevo, setNuevo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function agregar() {
    setError(null);
    start(async () => {
      const r = await crearDepartamento(nuevo);
      if (r.error) setError(r.error);
      else setNuevo("");
    });
  }

  return (
    <section className="rounded-card border border-gray-200 bg-white p-5 mb-5">
      <h3 className="text-sm font-semibold text-gray-900">Departamentos</h3>
      <p className="text-xs text-gray-500 mt-1 mb-3">
        Son los departamentos disponibles al agregar un usuario en Personas. Eliminar uno aquí no cambia el departamento de quienes ya lo tenían asignado.
      </p>
      <div className="space-y-1.5">
        {departamentos.map((d) => (
          <div key={d.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
            <span className="text-sm text-gray-800">{d.nombre}</span>
            <QuitarDeptBtn id={d.id} />
          </div>
        ))}
        {departamentos.length === 0 && <p className="text-sm text-gray-400">No hay departamentos registrados.</p>}
      </div>
      <div className="flex gap-2 mt-3">
        <input
          value={nuevo}
          onChange={(e) => { setNuevo(e.target.value); setError(null); }}
          onKeyDown={(e) => { if (e.key === "Enter") agregar(); }}
          placeholder="Ej. Tecnología"
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-info focus:outline-none"
        />
        <button onClick={agregar} disabled={pending} className="rounded-lg bg-info px-4 py-2 text-sm font-semibold text-white hover:bg-info-dark disabled:opacity-50">
          Agregar
        </button>
      </div>
      {error && <p className="text-xs text-danger mt-2">{error}</p>}
    </section>
  );
}

function QuitarDeptBtn({ id }: { id: string }) {
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  if (!confirm) return <button onClick={() => setConfirm(true)} className="text-xs font-semibold text-danger hover:underline">Quitar</button>;
  return (
    <span className="flex items-center gap-2">
      <span className="text-xs text-gray-500">¿Seguro?</span>
      <button disabled={pending} onClick={() => start(async () => { await quitarDepartamento(id); })} className="text-xs font-semibold text-danger hover:underline disabled:opacity-50">Sí</button>
      <button onClick={() => setConfirm(false)} className="text-xs text-gray-500 hover:text-gray-700">No</button>
    </span>
  );
}

function EliminarKpiBtn({ id }: { id: number }) {
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  if (!confirm) return <button onClick={() => setConfirm(true)} className="text-xs font-semibold text-danger hover:underline">Eliminar</button>;
  return (
    <span className="flex items-center gap-2">
      <span className="text-xs text-gray-500">¿Seguro?</span>
      <button disabled={pending} onClick={() => start(async () => { await eliminarKpi(id); })} className="text-xs font-semibold text-danger hover:underline disabled:opacity-50">Sí</button>
      <button onClick={() => setConfirm(false)} className="text-xs text-gray-500 hover:text-gray-700">No</button>
    </span>
  );
}

function SyncBar({ googleSheetsCount }: { googleSheetsCount: number }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 flex items-center justify-between gap-3 flex-wrap">
      <div className="text-xs text-gray-600">
        {googleSheetsCount > 0
          ? `${googleSheetsCount} KPI(s) con método "Google Sheets". "Sincronizar ahora" lee los valores desde tu hoja.`
          : 'Ningún KPI con método "Google Sheets" todavía.'}
        {msg && <span className="ml-2 text-success">{msg}</span>}
      </div>
      <button
        disabled={pending || googleSheetsCount === 0}
        onClick={() => start(async () => { const r = await sincronizarKpis(); setMsg(r.ok ?? r.error ?? null); })}
        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        {pending ? "Sincronizando…" : "Sincronizar ahora"}
      </button>
    </div>
  );
}

const FREQS = [["SEMANAL", "Semanal"], ["MENSUAL", "Mensual"], ["TRIMESTRAL", "Trimestral"], ["SEMESTRAL", "Semestral"], ["ANUAL", "Anual"]] as const;

function KpiModal({
  modo,
  kpi,
  personas,
  departamentos,
  onClose,
}: {
  modo: "nuevo" | "editar";
  kpi?: KpiRowVM;
  personas: PersonaMin[];
  departamentos: string[];
  onClose: () => void;
}) {
  const [f, setF] = useState<KpiInput>({
    nombre: kpi?.nombre ?? "",
    codigo: kpi?.codigo ?? "",
    area: kpi?.area ?? "",
    responsableId: kpi?.responsableId ?? "",
    frecuencia: kpi?.frecuencia ?? "MENSUAL",
    unidadMedida: kpi?.unidadMedida ?? "",
    tipoCalculo: kpi?.tipoCalculo ?? "",
    meta: kpi?.meta ?? "",
    sentido: kpi?.sentido ?? "MAYOR",
    valorActual: kpi?.valorActual ?? "",
    pct: kpi?.pct ?? 0,
    fuenteDatos: kpi?.fuenteDatos ?? "",
    metodoCaptura: kpi?.metodoCaptura ?? "MANUAL",
    hojaUrl: kpi?.hojaUrl ?? "",
    activo: kpi?.activo ?? true,
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = (patch: Partial<KpiInput>) => setF((prev) => ({ ...prev, ...patch }));
  const inp = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-info focus:outline-none";

  function guardar() {
    setError(null);
    start(async () => {
      const r = modo === "nuevo" ? await crearKpi(f) : await actualizarKpi(kpi!.id, f);
      if (r.error) setError(r.error);
      else onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">{modo === "nuevo" ? "Nuevo KPI" : "Editar KPI"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg">×</button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
            <input value={f.nombre} onChange={(e) => set({ nombre: e.target.value })} className={inp} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Código</label>
            <input value={f.codigo} onChange={(e) => set({ codigo: e.target.value })} placeholder="KPI-XXX-01" className={inp} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Área</label>
            <select value={f.area} onChange={(e) => set({ area: e.target.value })} className={`${inp} bg-white`}>
              <option value="">Selecciona…</option>
              {departamentos.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Responsable</label>
            <select value={f.responsableId} onChange={(e) => set({ responsableId: e.target.value })} className={`${inp} bg-white`}>
              <option value="">Sin asignar</option>
              {personas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Frecuencia</label>
            <select value={f.frecuencia} onChange={(e) => set({ frecuencia: e.target.value })} className={`${inp} bg-white`}>
              {FREQS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Unidad de medida</label>
            <input value={f.unidadMedida} onChange={(e) => set({ unidadMedida: e.target.value })} placeholder="%, días, $…" className={inp} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de cálculo</label>
            <input value={f.tipoCalculo} onChange={(e) => set({ tipoCalculo: e.target.value })} placeholder="Promedio del periodo…" className={inp} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Meta</label>
            <input value={f.meta} onChange={(e) => set({ meta: e.target.value })} placeholder="100%, ≤ 20%, > 0…" className={inp} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sentido de la meta</label>
            <select value={f.sentido} onChange={(e) => set({ sentido: e.target.value })} className={`${inp} bg-white`}>
              <option value="MAYOR">Mayor es mejor</option>
              <option value="MENOR">Menor es mejor</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Valor actual</label>
            <input value={f.valorActual} onChange={(e) => set({ valorActual: e.target.value })} placeholder="85%" className={inp} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">% de cumplimiento (0–100)</label>
            <input type="number" min={0} max={100} value={f.pct} onChange={(e) => set({ pct: Number(e.target.value) })} className={inp} />
            <p className="mt-1 text-[11px] text-gray-400">El estado (verde/ámbar/rojo) se calcula de este %.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Método de captura</label>
            <select value={f.metodoCaptura} onChange={(e) => set({ metodoCaptura: e.target.value })} className={`${inp} bg-white`}>
              <option value="MANUAL">Manual</option>
              <option value="GOOGLE_SHEETS">Google Sheets</option>
              <option value="ERP">ERP</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Fuente de datos</label>
            <input value={f.fuenteDatos} onChange={(e) => set({ fuenteDatos: e.target.value })} placeholder="Ventas_Diario — Google Sheets…" className={inp} />
          </div>
          {f.metodoCaptura === "GOOGLE_SHEETS" && (
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Enlace de Google Sheets</label>
              <input value={f.hojaUrl} onChange={(e) => set({ hojaUrl: e.target.value })} placeholder="https://docs.google.com/spreadsheets/d/…" className={inp} />
              <p className="mt-1 text-[11px] text-gray-400">
                La hoja debe estar pública («Cualquiera con el enlace: Lector») con columnas <b>Codigo</b>, <b>Valor Actual</b> y <b>% Cumplimiento</b> (0–100). Se empareja por el código de este KPI.
              </p>
            </div>
          )}
          <label className="sm:col-span-2 flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={f.activo} onChange={(e) => set({ activo: e.target.checked })} />
            KPI activo (visible en el tablero de Indicadores)
          </label>
        </div>

        {error && <p className="mt-3 text-sm text-danger bg-danger-bg rounded-lg px-3 py-2">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button onClick={guardar} disabled={pending} className="rounded-lg bg-info px-4 py-2 text-sm font-semibold text-white hover:bg-info-dark disabled:opacity-50">
            {pending ? "Guardando…" : modo === "nuevo" ? "Crear KPI" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
