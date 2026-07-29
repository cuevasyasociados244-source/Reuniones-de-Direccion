"use client";

import { useState, useTransition } from "react";
import { publicarReconocimiento, toggleLike, comentar } from "@/lib/acciones/reconocimientos";

export type ComentarioVM = { id: string; autorNombre: string; autorIniciales: string; texto: string };
export type PostVM = {
  id: string;
  autorNombre: string;
  autorIniciales: string;
  mensaje: string;
  fecha: string;
  likesCount: number;
  liked: boolean;
  comentarios: ComentarioVM[];
};
export type RecienteVM = { id: string; autorNombre: string; mensaje: string; fecha: string };

export default function ReconocimientosCliente({
  posts,
  recientes,
}: {
  posts: PostVM[];
  recientes: RecienteVM[];
}) {
  return (
    <div>
      <header className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Reconocimientos</h1>
        <p className="text-sm text-gray-500">Reconocimiento: celebrar y hacer visibles los logros del equipo.</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Compose />
          {posts.length === 0 && <p className="text-sm text-gray-500">Aún no hay reconocimientos. ¡Sé el primero!</p>}
          {posts.map((p) => (
            <Post key={p.id} post={p} />
          ))}
        </div>

        <aside>
          <div className="rounded-card border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Reconocimientos recientes</h3>
            {recientes.length === 0 && <p className="text-xs text-gray-400">Sin reconocimientos aún.</p>}
            <div className="space-y-3">
              {recientes.map((r) => (
                <div key={r.id} className="text-sm">
                  <div className="text-gray-700">{r.mensaje}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{r.autorNombre} · {r.fecha}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Avatar({ iniciales }: { iniciales: string }) {
  return (
    <div className="h-9 w-9 shrink-0 rounded-full bg-info flex items-center justify-center text-white text-xs font-bold">
      {iniciales}
    </div>
  );
}

function Compose() {
  const [texto, setTexto] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function publicar() {
    setMsg(null);
    start(async () => {
      const r = await publicarReconocimiento(texto);
      if (r.error) setMsg(r.error);
      else setTexto("");
    });
  }

  return (
    <div className="rounded-card border border-gray-200 bg-white p-4">
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={2}
        placeholder="Reconoce un logro del equipo…"
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-info focus:outline-none"
      />
      <div className="mt-2 flex items-center justify-between">
        {msg && <span className="text-xs text-danger">{msg}</span>}
        <button
          onClick={publicar}
          disabled={pending || !texto.trim()}
          className="ml-auto rounded-lg bg-info px-4 py-2 text-sm font-semibold text-white hover:bg-info-dark disabled:opacity-50"
        >
          {pending ? "Publicando…" : "Publicar"}
        </button>
      </div>
    </div>
  );
}

function Post({ post }: { post: PostVM }) {
  const [pending, start] = useTransition();
  const [comentando, setComentando] = useState(false);
  const [texto, setTexto] = useState("");

  function like() {
    start(async () => { await toggleLike(post.id); });
  }
  function enviarComentario() {
    if (!texto.trim()) return;
    start(async () => {
      const r = await comentar(post.id, texto);
      if (!r.error) { setTexto(""); setComentando(false); }
    });
  }

  return (
    <div className="rounded-card border border-gray-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <Avatar iniciales={post.autorIniciales} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-gray-900 text-sm">{post.autorNombre}</span>
            <span className="text-[11px] text-gray-400">{post.fecha}</span>
          </div>
          <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{post.mensaje}</p>

          <div className="flex items-center gap-4 mt-3 text-xs">
            <button
              onClick={like}
              disabled={pending}
              className={`flex items-center gap-1 font-semibold transition ${post.liked ? "text-info" : "text-gray-500 hover:text-gray-800"}`}
            >
              <span>{post.liked ? "♥" : "♡"}</span>
              Me gusta{post.likesCount > 0 ? ` · ${post.likesCount}` : ""}
            </button>
            <button onClick={() => setComentando((v) => !v)} className="font-semibold text-gray-500 hover:text-gray-800">
              Comentar{post.comentarios.length > 0 ? ` · ${post.comentarios.length}` : ""}
            </button>
          </div>

          {post.comentarios.length > 0 && (
            <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
              {post.comentarios.map((c) => (
                <div key={c.id} className="flex items-start gap-2">
                  <div className="h-6 w-6 shrink-0 rounded-full bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-600">{c.autorIniciales}</div>
                  <div className="text-sm">
                    <span className="font-semibold text-gray-800 text-xs">{c.autorNombre}</span>{" "}
                    <span className="text-gray-700">{c.texto}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {comentando && (
            <div className="mt-3 flex gap-2">
              <input
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") enviarComentario(); }}
                placeholder="Escribe un comentario…"
                className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-info focus:outline-none"
              />
              <button onClick={enviarComentario} disabled={pending || !texto.trim()} className="rounded-lg bg-info px-3 py-1.5 text-xs font-semibold text-white hover:bg-info-dark disabled:opacity-50">
                Enviar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
