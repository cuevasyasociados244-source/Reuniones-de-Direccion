import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/");

  return (
    <main className="min-h-screen flex items-center justify-center bg-brand-sidebar px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 h-14 w-14 rounded-xl bg-brand-tropical flex items-center justify-center text-white text-xl font-extrabold">
            R
          </div>
          <h1 className="text-xl font-bold text-gray-900">Integra One RCA</h1>
          <p className="text-sm text-gray-500">Rendición de Cuentas Aplicada</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
