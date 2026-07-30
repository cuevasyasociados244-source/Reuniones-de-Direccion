"use client";

import { useActionState, useState } from "react";
import {
  crearPersona,
  restablecerPassword,
  darDeBaja,
  reactivar,
  subirFotoPersona,
  type PersonaState,
} from "@/lib/acciones/personas";
import { archivoUrl } from "@/lib/archivoUrl";

export type PersonaVM = {
  id: string;
  usuario: string;
  nombre: string;
  puesto: string;
  area: string;
  iniciales: string;
  fotoUrl: string | null;
  activo: boolean;
};

const initial: PersonaState = {};

export default function PersonasCliente({
  activos,
  inactivos,
  departamentos,
  currentUserId,
}: {
  activos: PersonaVM[];
  inactivos: PersonaVM[];
  departamentos: string[];
  currentUserId: string;
}) {
  const [abrirNueva, setAbrirNueva] = useState(false);

  return (
    <div>
      <header className="mb-6 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Personas</h1>
          <p className="text-sm text-gray-500">
            Directorio de usuarios · {activos.length} activos
          </p>
        </div>
        <button
          onClick={() => setAbrirNueva((v) => !v)}
          className="rounded-lg bg-info px-4 py-2 text-sm font-semibold text-white hover:bg-info-dark transition"
        >
          {abrirNueva ? "Cerrar" : "+ Nueva persona"}
        </button>
      </header>

      {abrirNueva && (
        <NuevaPersonaForm
          departamentos={departamentos}
          onDone={() => setAbrirNueva(false)}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {activos.map((p) => (
          <PersonaCard key={p.id} persona={p} esYo={p.id === currentUserId} />
        ))}
      </div>

      {inactivos.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold text-gray-500 mb-3">
            Dados de baja ({inactivos.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {inactivos.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-card border border-gray-200 bg-gray-50 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-700 truncate">
                    {p.nombre}
                  </div>
                  <div className="text-xs text-gray-400 truncate">{p.puesto}</div>
                </div>
                <form action={reactivar}>
                  <input type="hidden" name="id" value={p.id} />
                  <button className="text-xs font-semibold text-info hover:underline">
                    Reactivar
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function PersonaCard({ persona, esYo }: { persona: PersonaVM; esYo: boolean }) {
  const [reset, setReset] = useState(false);
  const [confirmBaja, setConfirmBaja] = useState(false);

  return (
    <div className="rounded-card border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <form action={subirFotoPersona} className="relative group shrink-0">
          <input type="hidden" name="userId" value={persona.id} />
          <label className="block h-12 w-12 rounded-full bg-info overflow-hidden cursor-pointer flex items-center justify-center text-white font-bold" title="Cambiar foto">
            {persona.fotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={archivoUrl(persona.fotoUrl)} alt={persona.nombre} className="h-full w-full object-cover" />
            ) : (
              persona.iniciales
            )}
            <input
              type="file"
              name="foto"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
            />
          </label>
          <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-white border border-gray-200 text-[10px] flex items-center justify-center text-gray-500">✎</span>
        </form>
        <div className="min-w-0">
          <div className="font-semibold text-gray-900 truncate">{persona.nombre}</div>
          <div className="text-xs text-gray-500 truncate">{persona.puesto}</div>
          <div className="text-[11px] text-gray-400 truncate">
            {persona.area} · @{persona.usuario}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-3">
        <button
          onClick={() => setReset((v) => !v)}
          className="text-xs font-semibold text-gray-600 hover:text-gray-900"
        >
          Restablecer contraseña
        </button>
        {!esYo && (
          <div className="ml-auto">
            {confirmBaja ? (
              <form action={darDeBaja} className="flex items-center gap-2">
                <input type="hidden" name="id" value={persona.id} />
                <span className="text-xs text-gray-500">¿Seguro?</span>
                <button className="text-xs font-semibold text-danger hover:underline">
                  Sí, dar de baja
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmBaja(false)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  No
                </button>
              </form>
            ) : (
              <button
                onClick={() => setConfirmBaja(true)}
                className="text-xs font-semibold text-danger hover:underline"
              >
                Dar de baja
              </button>
            )}
          </div>
        )}
      </div>

      {reset && <ResetPasswordForm id={persona.id} onDone={() => setReset(false)} />}
    </div>
  );
}

function ResetPasswordForm({ id, onDone }: { id: string; onDone: () => void }) {
  const [state, action, pending] = useActionState(restablecerPassword, initial);

  return (
    <form action={action} className="mt-3 space-y-2 border-t border-gray-100 pt-3">
      <input type="hidden" name="id" value={id} />
      <input
        name="password"
        type="text"
        placeholder="Nueva contraseña (mín. 6)"
        className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-info focus:outline-none"
      />
      {state.error && <p className="text-xs text-danger">{state.error}</p>}
      {state.ok && <p className="text-xs text-success">{state.ok}</p>}
      <div className="flex gap-2">
        <button
          disabled={pending}
          className="rounded-lg bg-info px-3 py-1.5 text-xs font-semibold text-white hover:bg-info-dark disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
        <button type="button" onClick={onDone} className="text-xs text-gray-500 hover:text-gray-700">
          Cancelar
        </button>
      </div>
    </form>
  );
}

function NuevaPersonaForm({
  departamentos,
  onDone,
}: {
  departamentos: string[];
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(crearPersona, initial);

  return (
    <form
      action={action}
      className="mb-6 rounded-card border border-gray-200 bg-white p-5 grid gap-3 sm:grid-cols-2"
    >
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Nombre completo</label>
        <input name="nombre" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-info focus:outline-none" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Usuario (login)</label>
        <input name="usuario" placeholder="ej. ana" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-info focus:outline-none" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Puesto</label>
        <input name="puesto" placeholder="ej. Director Comercial" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-info focus:outline-none" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Área</label>
        <select name="area" defaultValue="" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-info focus:outline-none bg-white">
          <option value="" disabled>Selecciona…</option>
          {departamentos.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-gray-600 mb-1">Contraseña inicial</label>
        <input name="password" type="text" placeholder="mín. 6 caracteres" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-info focus:outline-none" />
        <p className="mt-1 text-[11px] text-gray-400">
          El puesto define el alcance: contiene «Director General» → global; contiene «Director» → área; si no → propio.
        </p>
      </div>

      {state.error && (
        <p className="sm:col-span-2 text-sm text-danger bg-danger-bg rounded-lg px-3 py-2">{state.error}</p>
      )}
      {state.ok && (
        <p className="sm:col-span-2 text-sm text-success bg-success-bg rounded-lg px-3 py-2">{state.ok}</p>
      )}

      <div className="sm:col-span-2 flex gap-2">
        <button disabled={pending} className="rounded-lg bg-info px-4 py-2 text-sm font-semibold text-white hover:bg-info-dark disabled:opacity-50">
          {pending ? "Guardando…" : "Agregar persona"}
        </button>
        <button type="button" onClick={onDone} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
          Cerrar
        </button>
      </div>
    </form>
  );
}
