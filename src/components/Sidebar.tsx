"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/navegacion";
import { cerrarSesion } from "@/lib/acciones/auth";

type Props = {
  items: NavItem[];
  usuario: { nombre: string; puesto: string; iniciales: string; fotoUrl: string | null };
};

export default function Sidebar({ items, usuario }: Props) {
  const pathname = usePathname();

  return (
    <aside className="w-[230px] shrink-0 bg-brand-sidebar text-gray-100 flex flex-col py-4 min-h-screen">
      <div className="flex items-center gap-2 px-5 pb-4 mb-2 border-b border-white/10">
        <div className="h-11 w-11 rounded-lg bg-brand-tropical flex items-center justify-center font-extrabold text-white">
          R
        </div>
        <div className="leading-tight">
          <div className="font-bold text-white text-sm">Integra One</div>
          <div className="text-[11px] text-gray-400">RCA</div>
        </div>
      </div>

      <nav className="flex-1">
        {items.map((it) => {
          const active =
            it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
          return (
            <Link
              key={it.key}
              href={it.href}
              className={`flex items-center gap-3 px-5 py-2.5 text-[13.5px] border-l-[3px] transition ${
                active
                  ? "bg-info/20 text-white border-info"
                  : "text-[#b7c2d6] border-transparent hover:bg-white/5 hover:text-white"
              }`}
            >
              {it.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-5 pt-3 border-t border-white/10">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="h-8 w-8 rounded-full bg-info flex items-center justify-center text-white text-xs font-bold overflow-hidden">
            {usuario.fotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={usuario.fotoUrl} alt={usuario.nombre} className="h-full w-full object-cover" />
            ) : (
              usuario.iniciales
            )}
          </div>
          <div className="leading-tight min-w-0">
            <div className="text-white text-xs font-semibold truncate">{usuario.nombre}</div>
            <div className="text-[10.5px] text-gray-400 truncate">{usuario.puesto}</div>
          </div>
        </div>
        <form action={cerrarSesion}>
          <button
            type="submit"
            className="w-full text-left text-[12px] text-gray-300 hover:text-white transition"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
