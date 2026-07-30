"use client";

import { useState, useTransition } from "react";
import { cerrarMes, type KpiState } from "@/lib/acciones/kpis";
import { BarChart, Donut, LineChart } from "@/components/Charts";

export type KpiVM = {
  id: number;
  nombre: string;
  codigo: string;
  area: string;
  responsableNombre: string;
  frecuencia: string;
  unidadMedida: string;
  tipoCalculo: string;
  meta: string;
  sentido: string;
  valorActual: string;
  pct: number;
  estado: "OBJETIVO" | "RIESGO" | "FUERA";
  fuenteDatos: string;
  metodoCaptura: string;
};

export type SnapshotVM = {
  periodoLabel: string;
  items: { codigo: string; nombre: string; area: string; meta: string; valorActual: string; pct: number; estado: string }[];
};

export type AcuerdoVM = { nombre: string; valorTxt: string; meta: string; sentido: string; color: string; nivelTxt: string };

export type KpisData = {
  esGlobal: boolean;
  periodoLabel: string;
  acuerdos: AcuerdoVM[];
  stats: { cumplimientoGeneral: number; objetivo: number; riesgo: number; fuera: number; total: number };
  porArea: { label: string; value: number }[];
  top5: { nombre: string; pct: number }[];
  tendencia: { label: string; value: number }[];
  kpis: KpiVM[];
  historico: SnapshotVM[];
};

const ESTADO = {
  OBJETIVO: { txt: "En objetivo", color: "#16a34a" },
  RIESGO: { txt: "En riesgo", color: "#d97706" },
  FUERA: { txt: "Fuera de objetivo", color: "#dc2626" },
} as const;

function colorEstado(e: string) {
  return ESTADO[e as keyof typeof ESTADO]?.color ?? "#64748b";
}

const TABS: { key: string; label: string }[] = [
  { key: "resumen", label: "Resumen" },
  { key: "area", label: "Por área" },
  { key: "proceso", label: "Por proceso" },
  { key: "tendencias", label: "Tendencias" },
  { key: "historico", label: "Histórico" },
];

export default function KpisCliente({ data }: { data: KpisData }) {
  const [tab, setTab] = useState("resumen");
  const [cerrarModal, setCerrarModal] = useState(false);

  return (
    <div>
      <header className="mb-4 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Indicadores (KPIs)</h1>
          <p className="text-sm text-gray-500">
            Seguimiento del desempeño. Periodo actual: <b>{data.periodoLabel}</b>.
          </p>
        </div>
        {data.esGlobal && (
          <button
            onClick={() => setCerrarModal(true)}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cerrar mes
          </button>
        )}
      </header>

      <AcuerdosSection acuerdos={data.acuerdos} />

      {/* KPIs operativos (captura manual) */}
      <h2 className="text-sm font-semibold text-gray-700 mb-2 mt-8">Indicadores operativos</h2>
      <div className="grid gap-3 grid-cols-2 md:grid-cols-5 mb-6">
        <StatCard label="Cumplimiento general" value={`${data.stats.cumplimientoGeneral}%`} tropical />
        <StatCard label="KPIs en objetivo" value={String(data.stats.objetivo)} color="#16a34a" />
        <StatCard label="KPIs en riesgo" value={String(data.stats.riesgo)} color="#d97706" />
        <StatCard label="KPIs fuera" value={String(data.stats.fuera)} color="#dc2626" />
        <StatCard label="Total KPIs" value={String(data.stats.total)} />
      </div>

      <div className="flex gap-1 border-b border-gray-200 mb-5 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition ${
              tab === t.key ? "border-info text-info" : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "resumen" && <Resumen data={data} />}
      {tab === "area" && <PorArea data={data} />}
      {tab === "proceso" && (
        <div>
          <p className="text-xs text-gray-400 mb-3">
            Los KPIs no tienen aún una dimensión de «proceso» en el modelo; se muestran todos los indicadores activos.
          </p>
          <TablaKpis kpis={data.kpis} />
        </div>
      )}
      {tab === "tendencias" && <Tendencias data={data} />}
      {tab === "historico" && <Historico data={data} />}

      {cerrarModal && (
        <CerrarMesModal
          periodoLabel={data.periodoLabel}
          total={data.stats.total}
          onClose={() => setCerrarModal(false)}
        />
      )}
    </div>
  );
}

function AcuerdosSection({ acuerdos }: { acuerdos: AcuerdoVM[] }) {
  const legend = [
    { c: "#16a34a", t: "95–100" },
    { c: "#eab308", t: "90–94" },
    { c: "#ea580c", t: "80–89" },
    { c: "#dc2626", t: "<80" },
  ];
  return (
    <section className="rounded-card border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Indicadores de compromisos · Dirección</h2>
          <p className="text-xs text-gray-500">Calculados automáticamente desde los compromisos.</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-gray-500">
          {legend.map((l) => (
            <span key={l.t} className="flex items-center gap-1">
              <i className="h-2.5 w-2.5 rounded-full inline-block" style={{ background: l.c }} />
              {l.t}
            </span>
          ))}
        </div>
      </div>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {acuerdos.map((a, i) => (
          <div key={i} className="rounded-lg border border-[#dbe6fb] bg-[#eef4ff] p-4" style={{ borderTop: `3px solid ${a.color}` }}>
            <div className="text-xs text-gray-500 leading-tight min-h-[2.4em]">{a.nombre}</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold" style={{ color: a.color }}>{a.valorTxt}</span>
              <span className="text-[11px] text-gray-400">meta {a.meta}</span>
            </div>
            <span className="mt-2 inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${a.color}22`, color: a.color }}>
              {a.nivelTxt}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatCard({ label, value, color, tropical }: { label: string; value: string; color?: string; tropical?: boolean }) {
  return (
    <div className={`rounded-card border p-4 ${tropical ? "bg-brand-tropical text-white border-transparent" : "bg-[#eef4ff] border-[#dbe6fb]"}`}>
      <div className={`text-xs ${tropical ? "text-white/80" : "text-gray-500"}`}>{label}</div>
      <div className="mt-1 text-2xl font-extrabold" style={{ color: tropical ? "#fff" : color ?? "#0f172a" }}>
        {value}
      </div>
    </div>
  );
}

function Resumen({ data }: { data: KpisData }) {
  const seg = [
    { value: data.stats.objetivo, color: "#16a34a", label: "En objetivo" },
    { value: data.stats.riesgo, color: "#d97706", label: "En riesgo" },
    { value: data.stats.fuera, color: "#dc2626", label: "Fuera" },
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card titulo="Cumplimiento por área">
          <BarChart data={data.porArea} />
        </Card>
        <Card titulo="Tendencia de cumplimiento general">
          {data.tendencia.length >= 2 ? (
            <LineChart data={data.tendencia} />
          ) : (
            <p className="text-xs text-gray-400 py-8 text-center">
              Aún no hay suficiente histórico. Cierra al menos dos meses para ver la tendencia.
            </p>
          )}
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card titulo="KPIs por estado">
          <Donut segments={seg} total={data.stats.total} />
          <div className="flex justify-center gap-3 mt-3 text-[11px]">
            <span style={{ color: "#16a34a" }}>● Objetivo {data.stats.objetivo}</span>
            <span style={{ color: "#d97706" }}>● Riesgo {data.stats.riesgo}</span>
            <span style={{ color: "#dc2626" }}>● Fuera {data.stats.fuera}</span>
          </div>
        </Card>
        <Card titulo="Top 5 KPIs (mejor desempeño)">
          {data.top5.length === 0 && <p className="text-xs text-gray-400">Sin KPIs.</p>}
          {data.top5.map((k, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="truncate pr-2">{i + 1}. {k.nombre}</span>
                <b>{k.pct}%</b>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full bg-brand-tropical" style={{ width: `${k.pct}%` }} />
              </div>
            </div>
          ))}
        </Card>
        <Card titulo="Alertas importantes">
          <Alerta color="#dc2626" titulo={`${data.stats.fuera} KPIs fuera del objetivo`} sub="Requieren atención inmediata" />
          <Alerta color="#d97706" titulo={`${data.stats.riesgo} KPIs en riesgo`} sub="Podrían incumplir la meta" />
          <Alerta color="#16a34a" titulo={`${data.stats.objetivo} KPIs en objetivo`} sub="Van según lo planeado" />
        </Card>
      </div>
      <Card titulo="KPIs activos">
        <TablaKpis kpis={data.kpis} sinBorde />
      </Card>
    </div>
  );
}

function PorArea({ data }: { data: KpisData }) {
  const areas = [...new Set(data.kpis.map((k) => k.area))].sort();
  return (
    <div className="space-y-6">
      {areas.length === 0 && <p className="text-sm text-gray-500">No hay KPIs en tu alcance.</p>}
      {areas.map((area) => {
        const kpis = data.kpis.filter((k) => k.area === area);
        const avg = Math.round(kpis.reduce((s, k) => s + k.pct, 0) / kpis.length);
        return (
          <Card key={area} titulo={`${area} · cumplimiento promedio ${avg}%`}>
            <TablaKpis kpis={kpis} sinBorde ocultarArea />
          </Card>
        );
      })}
    </div>
  );
}

function Tendencias({ data }: { data: KpisData }) {
  return (
    <Card titulo="Tendencia de cumplimiento general">
      {data.tendencia.length >= 2 ? (
        <LineChart data={data.tendencia} height={220} />
      ) : (
        <p className="text-xs text-gray-400 py-8 text-center">
          La tendencia se construye con los cierres mensuales. Cierra al menos dos meses para verla.
        </p>
      )}
    </Card>
  );
}

function Historico({ data }: { data: KpisData }) {
  return (
    <div className="space-y-6">
      <h3 className="text-sm font-semibold text-gray-700">Histórico de cierres mensuales</h3>
      {data.historico.length === 0 && (
        <p className="text-sm text-gray-500">
          Aún no se ha cerrado ningún mes. {data.esGlobal ? 'Usa "Cerrar mes" para guardar el primer registro.' : "Cuando el Director General cierre el primer mes, aquí verás la evolución."}
        </p>
      )}
      {data.historico.map((snap, i) => (
        <Card key={i} titulo={snap.periodoLabel}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-2 pr-3 font-medium">KPI</th>
                <th className="py-2 pr-3 font-medium">Área</th>
                <th className="py-2 pr-3 font-medium">Meta</th>
                <th className="py-2 pr-3 font-medium">Actual</th>
                <th className="py-2 pr-3 font-medium">Cumpl.</th>
                <th className="py-2 font-medium text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {snap.items.map((k, j) => (
                <tr key={j} className="border-b border-gray-50">
                  <td className="py-2 pr-3">{k.nombre}</td>
                  <td className="py-2 pr-3 text-gray-500">{k.area}</td>
                  <td className="py-2 pr-3 text-gray-500">{k.meta}</td>
                  <td className="py-2 pr-3">{k.valorActual}</td>
                  <td className="py-2 pr-3">{k.pct}%</td>
                  <td className="py-2 text-center">
                    <span className="inline-block h-3 w-3 rounded-full" style={{ background: colorEstado(k.estado) }} />
                  </td>
                </tr>
              ))}
              {snap.items.length === 0 && (
                <tr><td colSpan={6} className="py-3 text-gray-400 text-sm">Sin KPIs en tu alcance para este mes.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      ))}
    </div>
  );
}

function TablaKpis({ kpis, sinBorde, ocultarArea }: { kpis: KpiVM[]; sinBorde?: boolean; ocultarArea?: boolean }) {
  return (
    <div className={sinBorde ? "" : "rounded-card border border-[#dbe6fb] bg-[#eef4ff] overflow-hidden"}>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b border-gray-100">
            <th className="py-2 pr-3 font-medium">KPI</th>
            {!ocultarArea && <th className="py-2 pr-3 font-medium">Área</th>}
            <th className="py-2 pr-3 font-medium">Meta</th>
            <th className="py-2 pr-3 font-medium">Actual</th>
            <th className="py-2 pr-3 font-medium w-40">Cumplimiento</th>
            <th className="py-2 font-medium text-center">Estado</th>
          </tr>
        </thead>
        <tbody>
          {kpis.map((k) => (
            <tr key={k.id} className="border-b border-gray-50">
              <td className="py-2.5 pr-3 text-gray-900">
                {k.nombre}
                {k.metodoCaptura === "GOOGLE_SHEETS" && (
                  <span title={`Vinculado a ${k.fuenteDatos || "Google Sheets"}`} className="ml-1 text-info">🔗</span>
                )}
              </td>
              {!ocultarArea && <td className="py-2.5 pr-3 text-gray-500">{k.area}</td>}
              <td className="py-2.5 pr-3 text-gray-500">{k.meta}</td>
              <td className="py-2.5 pr-3 text-gray-700">{k.valorActual}</td>
              <td className="py-2.5 pr-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${k.pct}%`, background: colorEstado(k.estado) }} />
                  </div>
                  <span className="text-[11px] font-bold text-gray-600 w-9 text-right">{k.pct}%</span>
                </div>
              </td>
              <td className="py-2.5 text-center">
                <span title={ESTADO[k.estado]?.txt} className="inline-block h-3 w-3 rounded-full" style={{ background: colorEstado(k.estado) }} />
              </td>
            </tr>
          ))}
          {kpis.length === 0 && (
            <tr><td colSpan={ocultarArea ? 5 : 6} className="py-3 text-gray-400 text-sm">No hay KPIs en tu alcance.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Card({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-card border border-[#dbe6fb] bg-[#eef4ff] p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{titulo}</h3>
      {children}
    </div>
  );
}

function Alerta({ color, titulo, sub }: { color: string; titulo: string; sub: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: color }} />
      <div>
        <div className="text-xs font-semibold text-gray-800">{titulo}</div>
        <div className="text-[11px] text-gray-400">{sub}</div>
      </div>
    </div>
  );
}

/* ---------- Modal Cerrar mes ---------- */
function CerrarMesModal({ periodoLabel, total, onClose }: { periodoLabel: string; total: number; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function confirmar() {
    setError(null);
    start(async () => {
      const r: KpiState = await cerrarMes();
      if (r.error) setError(r.error);
      else onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-bold text-gray-900">Cerrar mes de KPIs</h2>
        <p className="text-sm text-gray-500 mt-1">
          Vas a cerrar el periodo de <b>{periodoLabel}</b> con los {total} KPIs actuales.
        </p>
        <div className="mt-3 rounded-lg bg-gray-50 border border-gray-100 p-3 text-xs text-gray-600">
          Se guardará una copia de los valores actuales en «Histórico» y el tablero avanzará al siguiente mes. No se eliminan KPIs: solo actualizas el «Actual» de cada uno conforme tengas el avance del nuevo mes.
        </div>
        {error && <p className="mt-3 text-sm text-danger bg-danger-bg rounded-lg px-3 py-2">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button onClick={confirmar} disabled={pending} className="rounded-lg bg-info px-4 py-2 text-sm font-semibold text-white hover:bg-info-dark disabled:opacity-50">
            {pending ? "Cerrando…" : "Cerrar mes"}
          </button>
        </div>
      </div>
    </div>
  );
}
