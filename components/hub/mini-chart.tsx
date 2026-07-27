/**
 * Tiny dependency-free charts (inline SVG). Used on the Hub overview so we
 * avoid shipping a charting library. Purely presentational, server-renderable.
 */

export function BarChart({
  data,
  height = 120,
  color = "var(--purple)",
}: {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const barW = 100 / Math.max(1, data.length);
  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      {data.map((d, i) => {
        const h = (d.value / max) * (height - 12);
        return (
          <rect
            key={i}
            x={i * barW + barW * 0.18}
            y={height - h}
            width={barW * 0.64}
            height={Math.max(h, d.value > 0 ? 1.5 : 0)}
            rx={0.8}
            fill={color}
            opacity={0.85}
          />
        );
      })}
    </svg>
  );
}

export function LineChart({
  data,
  height = 120,
  color = "var(--cyan)",
}: {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const n = Math.max(1, data.length - 1);
  const pts = data.map((d, i) => {
    const x = (i / n) * 100;
    const y = height - (d.value / max) * (height - 12) - 4;
    return [x, y] as const;
  });
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" ");
  const area = `${path} L100,${height} L0,${height} Z`;
  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      <path d={area} fill={color} opacity={0.12} />
      <path d={path} fill="none" stroke={color} strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
