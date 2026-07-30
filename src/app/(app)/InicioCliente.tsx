"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart, LineChart } from "@/components/Charts";
import ResultadoModal from "@/components/ResultadoModal";

export type FilaVM = {
  id: number;
  titulo: string;
  responsableNombre: string;
  vence: string;
  avance: number;
};

export type InicioData = {
  nombre: string;
  esGlobal: boolean;
  scopeLabel: string;
  area: string;
  fechaHoy: string;
  indicadores: { nombre: string; valorTxt: string; meta: string; color: string; nivelTxt: string }[];
  porArea: { label: string; value: number }[];
  tendencia: { label: string; value: number }[];
  enTiempo: FilaVM[];
  proximos: FilaVM[];
  vencidos: FilaVM[];
};

export default function InicioCliente({ data }: { data: InicioData }) {
  const [resultadoFor, setResultadoFor] = useState<FilaVM | null>(null);

  return (
    <div>
      <header className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">
          ¡Hola, {data.nombre.split(" ")[0]}!{" "}
          <span className="ml-1 align-middle text-[11px] font-semibold text-gray-400">
            · alcance {data.scopeLabel}
          </span>
        </h1>
        <p className="text-sm text-gray-500">Resumen ejecutivo de hoy, {data.fechaHoy}.</p>
      </header>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-6">
        {data.indicadores.map((ind, i) => (
          <div key={i} className="rounded-card border border-[#dbe6fb] bg-[#eef4ff] p-4" style={{ borderTop: `3px solid ${ind.color}` }}>
            <div className="text-xs text-gray-500 leading-tight min-h-[2.4em]">{ind.nombre}</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold" style={{ color: ind.color }}>{ind.valorTxt}</span>
              <span className="text-[11px] text-gray-400">meta {ind.meta}</span>
            </div>
            <span className="mt-2 inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${ind.color}22`, color: ind.color }}>
              {ind.nivelTxt}
            </span>
          </div>
        ))}
      </div>

      {data.esGlobal ? (
        <div className="grid gap-4 lg:grid-cols-2 mb-6">
          <Card titulo="Cumplimiento por área">
            <BarChart data={data.porArea} />
          </Card>
          <Card titulo="Tendencia de cumplimiento">
            {data.tendencia.length >= 2 ? (
              <LineChart data={data.tendencia} />
            ) : (
              <p className="text-xs text-gray-400 py-8 text-center">
                La tendencia se construye con los cierres mensuales de KPIs.
              </p>
            )}
          </Card>
        </div>
      ) : (
        <div className="mb-6">
          <Card titulo={`Cumplimiento de tu área${data.area ? ` (${data.area})` : ""}`}>
            {data.porArea.length > 0 ? (
              <BarChart data={data.porArea} />
            ) : (
              <p className="text-xs text-gray-400 py-6 text-center">Aún no hay datos de cumplimiento para tu área.</p>
            )}
          </Card>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <ColumnaInicio
          titulo="En tiempo"
          sub="Van según lo planeado"
          color="#2563eb"
          filas={data.enTiempo}
          vacio="No tienes actividades en curso."
        />
        <ColumnaInicio
          titulo="Próximos a vencer"
          sub="Cercanos a su fecha límite"
          color="#16a34a"
          filas={data.proximos}
          vacio="No tienes compromisos próximos a vencer."
        />
        <ColumnaInicio
          titulo="Vencidos"
          sub="Requieren atención inmediata"
          color="#dc2626"
          filas={data.vencidos}
          vacio="No tienes compromisos vencidos."
          esVencidos
          onRegistrar={data.esGlobal ? undefined : setResultadoFor}
        />
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

function ColumnaInicio({
  titulo,
  sub,
  color,
  filas,
  vacio,
  esVencidos,
  onRegistrar,
}: {
  titulo: string;
  sub: string;
  color: string;
  filas: FilaVM[];
  vacio: string;
  esVencidos?: boolean;
  onRegistrar?: (f: FilaVM) => void;
}) {
  return (
    <div className="rounded-card border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100" style={{ borderTop: `3px solid ${color}` }}>
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-gray-900 text-sm">{titulo}</h4>
          <span className="text-xs font-bold text-white rounded-full px-2 py-0.5" style={{ background: color }}>
            {filas.length}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </div>
      <div className="p-3 space-y-3">
        {filas.length === 0 && <p className="text-xs text-gray-400 py-4 text-center">{vacio}</p>}
        {filas.map((c) => (
          <div key={c.id} className="rounded-lg border border-gray-100 p-3">
            <div className="text-sm font-medium text-gray-900">{c.titulo}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">
              {c.responsableNombre} · {esVencidos ? "venció" : "vence"} {c.vence}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${c.avance}%`, background: color }} />
              </div>
              <span className="text-[11px] font-bold text-gray-600 w-9 text-right">{c.avance}%</span>
            </div>
            {esVencidos && onRegistrar && (
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
      <Link
        href="/compromisos"
        className="block px-4 py-2.5 text-xs font-semibold border-t border-gray-100 hover:bg-gray-50 transition"
        style={{ color }}
      >
        Ver todas las actividades →
      </Link>
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
