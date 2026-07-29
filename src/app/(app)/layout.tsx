import { requireSession } from "@/lib/session";
import { puedeVerModulo } from "@/lib/scope";
import { NAV_ITEMS } from "@/lib/navegacion";
import Sidebar from "@/components/Sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSession();

  // El menú se filtra por alcance en el servidor (no es solo cosmético).
  const items = NAV_ITEMS.filter((it) => puedeVerModulo(user, it.key));

  return (
    <div className="flex min-h-screen">
      <Sidebar
        items={items}
        usuario={{
          nombre: user.nombre,
          puesto: user.puesto,
          iniciales: user.iniciales,
          fotoUrl: user.fotoUrl,
        }}
      />
      <main className="flex-1 min-w-0 p-6 md:p-8 pb-16">{children}</main>
    </div>
  );
}
