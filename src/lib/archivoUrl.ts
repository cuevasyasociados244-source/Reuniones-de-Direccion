// Construye la URL del proxy interno para servir un blob privado (usable en
// componentes cliente y servidor). El proxy verifica la sesión y hace el fetch
// autenticado del lado del servidor.
export function archivoUrl(blobUrl: string, opts?: { descargar?: boolean; nombre?: string }) {
  const p = new URLSearchParams({ u: blobUrl });
  if (opts?.descargar) p.set("dl", "1");
  if (opts?.nombre) p.set("n", opts.nombre);
  return `/api/archivo?${p.toString()}`;
}
