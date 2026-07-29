import type { ModuleKey } from "./scope";

export type NavItem = {
  key: ModuleKey;
  label: string;
  href: string;
};

// Las 9 entradas del menú lateral (§4). El filtrado por scope se hace con
// puedeVerModulo(); aquí solo se define el orden y las rutas.
export const NAV_ITEMS: NavItem[] = [
  { key: "inicio", label: "Inicio", href: "/" },
  { key: "compromisos", label: "Compromisos", href: "/compromisos" },
  { key: "reuniones", label: "Reuniones de Dirección", href: "/reuniones" },
  { key: "avance", label: "Avance de Compromisos", href: "/avance" },
  { key: "reconocimientos", label: "Reconocimientos", href: "/reconocimientos" },
  { key: "kpis", label: "Indicadores (KPIs)", href: "/kpis" },
  { key: "personas", label: "Personas", href: "/personas" },
  { key: "documentos", label: "Documentos", href: "/documentos" },
  { key: "configuracion", label: "Configuración", href: "/configuracion" },
];
