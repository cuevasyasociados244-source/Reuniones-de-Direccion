import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/session";

// Sirve un blob PRIVADO de Vercel Blob solo a usuarios con sesión.
// El navegador nunca recibe el token; el fetch autenticado ocurre en el servidor.
const HOST_OK = /\.blob\.vercel-storage\.com$/;

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return new Response("No autorizado", { status: 401 });

  const u = req.nextUrl.searchParams.get("u");
  if (!u) return new Response("Falta el parámetro u", { status: 400 });

  let url: URL;
  try {
    url = new URL(u);
  } catch {
    return new Response("URL inválida", { status: 400 });
  }
  if (url.protocol !== "https:" || !HOST_OK.test(url.hostname)) {
    return new Response("Origen no permitido", { status: 400 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const r = await fetch(url.toString(), { headers: { authorization: `Bearer ${token}` } });
  if (!r.ok) return new Response("Archivo no disponible", { status: r.status });

  const headers = new Headers();
  headers.set("content-type", r.headers.get("content-type") || "application/octet-stream");
  headers.set("cache-control", "private, max-age=300");
  if (req.nextUrl.searchParams.get("dl") === "1") {
    const nombre = req.nextUrl.searchParams.get("n") || "documento";
    headers.set("content-disposition", `attachment; filename="${nombre.replace(/"/g, "")}"`);
  }
  return new Response(r.body, { status: 200, headers });
}
