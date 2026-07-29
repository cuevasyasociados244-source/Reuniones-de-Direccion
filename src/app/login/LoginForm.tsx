"use client";

import { useActionState } from "react";
import { iniciarSesion, type LoginState } from "@/lib/acciones/auth";

const initial: LoginState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(iniciarSesion, initial);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Usuario
        </label>
        <input
          name="usuario"
          autoComplete="username"
          autoFocus
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-info focus:outline-none focus:ring-1 focus:ring-info"
          placeholder="ej. guillermo"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Contraseña
        </label>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-info focus:outline-none focus:ring-1 focus:ring-info"
          placeholder="••••••••"
        />
      </div>

      {state.error && (
        <p className="text-sm text-danger bg-danger-bg rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-info py-2.5 text-sm font-semibold text-white transition hover:bg-info-dark disabled:opacity-50"
      >
        {pending ? "Entrando…" : "Iniciar sesión"}
      </button>
    </form>
  );
}
