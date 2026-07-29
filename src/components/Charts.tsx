"use client";

// Gráficas SVG mínimas compartidas (KPIs e Inicio). Sin dependencias externas.

export function BarChart({ data }: { data: { label: string; value: number }[] }) {
  if (data.length === 0) return <p className="text-xs text-gray-400 py-8 text-center">Sin datos.</p>;
  const w = 400, h = 160, padB = 34, padT = 10;
  const plotH = h - padB - padT;
  const slot = w / data.length;
  const barW = Math.min(40, slot * 0.5);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 160 }}>
      {[0, 50, 100].map((g) => {
        const y = padT + plotH - (g / 100) * plotH;
        return <line key={g} x1={0} y1={y} x2={w} y2={y} stroke="#e2e8f0" strokeWidth={1} />;
      })}
      {data.map((d, i) => {
        const x = slot * i + slot / 2;
        const bh = (Math.min(d.value, 100) / 100) * plotH;
        const y = padT + plotH - bh;
        return (
          <g key={i}>
            <rect x={x - barW / 2} y={y} width={barW} height={bh} rx={5} fill="url(#chartBar)" />
            <text x={x} y={y - 5} fontSize={11} fontWeight={700} fill="#334155" textAnchor="middle">{d.value}%</text>
            <text x={x} y={h - 8} fontSize={9.5} fill="#64748b" textAnchor="middle">{d.label.length > 12 ? d.label.slice(0, 11) + "…" : d.label}</text>
          </g>
        );
      })}
      <defs>
        <linearGradient id="chartBar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Donut({ segments, total }: { segments: { value: number; color: string }[]; total: number }) {
  const r = 40, c = 2 * Math.PI * r;
  const sum = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  return (
    <div className="relative mx-auto" style={{ width: 130, height: 130 }}>
      <svg viewBox="0 0 100 100" style={{ width: 130, height: 130, transform: "rotate(-90deg)" }}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth="14" />
        {segments.map((s, i) => {
          const len = (s.value / sum) * c;
          const el = <circle key={i} cx="50" cy="50" r={r} fill="none" stroke={s.color} strokeWidth="14" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-acc} />;
          acc += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-xl font-extrabold">{total}</div>
        <div className="text-[10px] text-gray-500">Total</div>
      </div>
    </div>
  );
}

export function LineChart({ data, height = 160 }: { data: { label: string; value: number }[]; height?: number }) {
  const w = 400;
  const stepX = w / (data.length - 1);
  const pts = data.map((d, i) => ({ x: i * stepX, y: height - (d.value / 100) * (height - 24) - 12, ...d }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }}>
      <path d={line} fill="none" stroke="#2563eb" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3} fill="#fff" stroke="#2563eb" strokeWidth={2} />
          <text x={p.x} y={p.y - 8} fontSize={10} fontWeight={700} fill="#334155" textAnchor="middle">{p.value}%</text>
          <text x={p.x} y={height - 3} fontSize={9} fill="#64748b" textAnchor="middle">{p.label}</text>
        </g>
      ))}
    </svg>
  );
}
