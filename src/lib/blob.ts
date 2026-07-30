import "server-only";
import { put, del } from "@vercel/blob";

// Sube un archivo al Blob privado. Devuelve la URL (privada) y metadatos.
export async function subirArchivo(carpeta: string, file: File) {
  const safe = (file.name || "archivo").replace(/[^\w.\-]/g, "_");
  const r = await put(`${carpeta}/${safe}`, file, {
    access: "private",
    addRandomSuffix: true,
    contentType: file.type || undefined,
  });
  return { url: r.url, pathname: r.pathname, contentType: r.contentType };
}

export async function borrarArchivo(url: string) {
  try {
    await del(url);
  } catch {
    // si ya no existe, ignorar
  }
}

// Ruta interna para servir un blob privado a través de la app.
export function urlProxy(blobUrl: string, opts?: { descargar?: boolean; nombre?: string }) {
  const p = new URLSearchParams({ u: blobUrl });
  if (opts?.descargar) p.set("dl", "1");
  if (opts?.nombre) p.set("n", opts.nombre);
  return `/api/archivo?${p.toString()}`;
}
