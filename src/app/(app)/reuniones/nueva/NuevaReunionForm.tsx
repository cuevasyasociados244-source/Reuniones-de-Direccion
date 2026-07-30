"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { crearReunion } from "@/lib/acciones/reuniones";

type Tema = { titulo: string; descripcion: string; duracion: number };
type Persona = { id: string; nombre: string; puesto: string };

const AGENDA_SUGERIDA: Tema[] = [
  { titulo: "Revisión de compromisos anteriores", descripcion: "", duracion: 20 },
  { titulo: "Resultados por área", descripcion: "", duracion: 25 },
  { titulo: "Nuevos compromisos", descripcion: "", duracion: 15 },
];

export default function NuevaReunionForm({ personas }: { personas: Persona[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [titulo, setTitulo] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("09:00");
  const [lugar, setLugar] = useState("");
  const [tipo, setTipo] = useState("ORDINARIA");
  const [frecuencia, setFrecuencia] = useState("MENSUAL");
  const [objetivo, setObjetivo] = useState("");
  const [agenda, setAgenda] = useState<Tema[]>(AGENDA_SUGERIDA);
  const [asistentes, setAsistentes] = useState<string[]>(personas.map((p) => p.id));

  function setTema(i: number, patch: Partial<Tema>) {
    setAgenda((prev) => prev.map((t, j) => (j === i ? { ...t, ...patch } : t)));
  }
  function addTema() {
    setAgenda((prev) => [...prev, { titulo: "", descripcion: "", duracion: 10 }]);
  }
  function removeTema(i: number) {
    setAgenda((prev) => prev.filter((_, j) => j !== i));
  }
  function toggleAsistente(id: string) {
    setAsistentes((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function guardar() {
    setError(null);
    start(async () => {
      const r = await crearReunion({ titulo, fecha, hora, lugar, tipo, frecuencia, objetivo, agenda, asistentes });
      if (r.error) setError(r.error);
      else if (r.id) router.push(`/reuniones/${r.id}`);
    });
  }

  const inp = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-info focus:outline-none";

  return (
    <div className="max-w-3xl space-y-6">
      <section className="rounded-card border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Información general</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Título</label>
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} className={inp} placeholder="ej. Reunión de Dirección — Agosto" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inp} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Hora</label>
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className={inp} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Lugar o enlace</label>
            <input value={lugar} onChange={(e) => setLugar(e.target.value)} className={inp} placeholder="Sala de Dirección / enlace" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={`${inp} bg-white`}>
              <option value="ORDINARIA">Ordinaria</option>
              <option value="EXTRAORDINARIA">Extraordinaria</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Frecuencia</label>
            <select value={frecuencia} onChange={(e) => setFrecuencia(e.target.value)} className={`${inp} bg-white`}>
              <option value="SEMANAL">Semanal</option>
              <option value="MENSUAL">Mensual</option>
              <option value="TRIMESTRAL">Trimestral</option>
              <option value="SEMESTRAL">Semestral</option>
              <option value="ANUAL">Anual</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Objetivo</label>
            <textarea value={objetivo} onChange={(e) => setObjetivo(e.target.value)} rows={2} className={inp} placeholder="¿Qué se busca lograr en esta reunión?" />
          </div>
        </div>
      </section>

      <section className="rounded-card border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Agenda</h3>
          <button onClick={addTema} className="text-xs font-semibold text-info hover:underline">+ Agregar tema</button>
        </div>
        <div className="space-y-2">
          {agenda.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={t.titulo} onChange={(e) => setTema(i, { titulo: e.target.value })} placeholder={`Tema ${i + 1}`} className="flex-1 min-w-0 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-info focus:outline-none" />
              <input type="number" min={0} value={t.duracion} onChange={(e) => setTema(i, { duracion: Number(e.target.value) })} className="w-20 shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-info focus:outline-none" title="minutos" />
              <span className="text-xs text-gray-400">min</span>
              <button type="button" onClick={() => removeTema(i)} className="text-danger text-lg leading-none px-1" title="Quitar">×</button>
            </div>
          ))}
          {agenda.length === 0 && <p className="text-xs text-gray-400">Sin temas. Agrega al menos uno.</p>}
        </div>
      </section>

      <section className="rounded-card border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Asistentes</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {personas.map((p) => (
            <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={asistentes.includes(p.id)} onChange={() => toggleAsistente(p.id)} />
              <span className="text-gray-800">{p.nombre}</span>
              <span className="text-xs text-gray-400">· {p.puesto}</span>
            </label>
          ))}
        </div>
      </section>

      {error && <p className="text-sm text-danger bg-danger-bg rounded-lg px-3 py-2">{error}</p>}

      <div className="flex gap-2">
        <button onClick={guardar} disabled={pending} className="rounded-lg bg-info px-5 py-2.5 text-sm font-semibold text-white hover:bg-info-dark disabled:opacity-50">
          {pending ? "Creando…" : "Crear reunión"}
        </button>
        <button onClick={() => router.push("/reuniones")} className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
          Cancelar
        </button>
      </div>
    </div>
  );
}
