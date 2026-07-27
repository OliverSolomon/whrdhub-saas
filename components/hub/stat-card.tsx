import Link from "next/link";

/**
 * KPI card: label, large value (with optional unit prefix), a soft sparkline,
 * and a delta pill with a caption. Modelled on the reference dashboard cards.
 * Dependency-free inline SVG so it renders on the server.
 */
export interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  series?: number[];
  delta?: string;
  deltaTone?: "up" | "down" | "flat";
  caption?: string;
  color?: string; // sparkline stroke
  href?: string;
}

function Sparkline({ series, color }: { series: number[]; color: string }) {
  const data = series.length ? series : [0, 0];
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const n = Math.max(1, data.length - 1);
  const W = 100;
  const H = 34;
  const pts = data.map((v, i) => {
    const x = (i / n) * W;
    const y = H - ((v - min) / span) * (H - 6) - 3;
    return [x, y] as const;
  });
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height: H }}>
      <path d={area} fill={color} opacity={0.1} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.6} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function StatCard({ label, value, unit, series = [], delta, deltaTone = "up", caption, color = "var(--purple)", href }: StatCardProps) {
  const pillTone =
    deltaTone === "up" ? "bg-emerald-50 text-emerald-700" : deltaTone === "down" ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-600";

  const inner = (
    <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5 h-full flex flex-col">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 flex items-baseline gap-1.5">
        {unit && <span className="text-xs font-bold text-muted">{unit}</span>}
        <span className="text-2xl sm:text-3xl font-black text-ink leading-none">{value}</span>
      </p>
      <div className="mt-3 flex-1 min-h-[2.2rem] flex items-end">
        <Sparkline series={series} color={color} />
      </div>
      {(delta || caption) && (
        <div className="mt-3 flex items-center gap-2">
          {delta && <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pillTone}`}>{delta}</span>}
          {caption && <span className="text-xs text-muted truncate">{caption}</span>}
        </div>
      )}
    </div>
  );

  return href ? (
    <Link href={href} className="block hover:shadow-md rounded-2xl transition-shadow">{inner}</Link>
  ) : inner;
}
