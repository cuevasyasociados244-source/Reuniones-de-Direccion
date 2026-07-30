"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { subirDocumento, eliminarDocumento, type DocState } from "@/lib/acciones/documentos";

export type DocVM = {
  id: string;
  nombre: string;
  area: string;
  tamanoTxt: string;
  subidoPorNombre: string;
  fecha: string;
  url: string;
  esMio: boolean;
};

const initial: DocState = {};

function proxyDescarga(url: string, nombre: string) {
  return `/api/archivo?u=${encodeURIComponent(url)}&dl=1&n=${encodeURIComponent(nombre)}`;
}

export default function DocumentosCliente({
  documentos,
  departamentos,
}: {
  documentos: DocVM[];
  departamentos: string[];
}) {
  const [state, action, pending] = useActionState(subirDocumento, initial);
  const formRef = useRef<HTMLFormElement>(null);

  // Limpia el formulario tras subir con éxito.
  if (state.ok && formRef.current) formRef.current.reset();

  return (
    <div>
      <header className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Documentos</h1>
        <p className="text-sm text-gray-500">Repositorio de archivos de la organización.</p>
      </header>

      <form ref={formRef} action={action} className="rounded-card border border-gray-200 bg-white p-5 mb-6 grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Archivo</label>
          <input name="archivo" type="file" className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-info file:px-4 file:py-2 file:text-white file:font-semibold file:text-sm hover:file:bg-info-dark" />
          <p className="mt-1 text-[11px] text-gray-400">Máximo 15 MB. PDF, imágenes, Office, etc.</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nombre (opcional)</label>
          <input name="nombre" placeholder="Se usa el nombre del archivo si lo dejas vacío" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-info focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Área (opcional)</label>
          <select name="area" defaultValue="" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:border-info focus:outline-none">
            <option value="">General</option>
            {departamentos.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        {state.error && <p className="sm:col-span-2 text-sm text-danger bg-danger-bg rounded-lg px-3 py-2">{state.error}</p>}
        {state.ok && <p className="sm:col-span-2 text-sm text-success bg-success-bg rounded-lg px-3 py-2">{state.ok}</p>}
        <div className="sm:col-span-2">
          <button disabled={pending} className="rounded-lg bg-info px-4 py-2 text-sm font-semibold text-white hover:bg-info-dark disabled:opacity-50">
            {pending ? "Subiendo…" : "Subir documento"}
          </button>
        </div>
      </form>

      <div className="rounded-card border border-gray-200 bg-white overflow-hidden">
        {documentos.length === 0 ? (
          <p className="px-5 py-6 text-sm text-gray-500">Aún no hay documentos. Sube el primero arriba.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="px-5 py-2 font-medium">Documento</th>
                <th className="px-5 py-2 font-medium">Área</th>
                <th className="px-5 py-2 font-medium">Tamaño</th>
                <th className="px-5 py-2 font-medium">Subido por</th>
                <th className="px-5 py-2 font-medium">Fecha</th>
                <th className="px-5 py-2 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {documentos.map((d) => (
                <tr key={d.id} className="border-b border-gray-50">
                  <td className="px-5 py-2.5 text-gray-900">{d.nombre}</td>
                  <td className="px-5 py-2.5 text-gray-500">{d.area || "General"}</td>
                  <td className="px-5 py-2.5 text-gray-500">{d.tamanoTxt}</td>
                  <td className="px-5 py-2.5 text-gray-500">{d.subidoPorNombre}</td>
                  <td className="px-5 py-2.5 text-gray-500">{d.fecha}</td>
                  <td className="px-5 py-2.5 text-right whitespace-nowrap">
                    <a href={proxyDescarga(d.url, d.nombre)} className="text-xs font-semibold text-info hover:underline">Descargar</a>
                    {d.esMio && <span className="mx-2 text-gray-200">|</span>}
                    {d.esMio && <EliminarBtn id={d.id} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function EliminarBtn({ id }: { id: string }) {
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  if (!confirm) return <button onClick={() => setConfirm(true)} className="text-xs font-semibold text-danger hover:underline">Eliminar</button>;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-xs text-gray-500">¿Seguro?</span>
      <button disabled={pending} onClick={() => start(async () => { await eliminarDocumento(id); })} className="text-xs font-semibold text-danger hover:underline disabled:opacity-50">Sí</button>
      <button onClick={() => setConfirm(false)} className="text-xs text-gray-500 hover:text-gray-700">No</button>
    </span>
  );
}
