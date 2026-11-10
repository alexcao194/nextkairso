interface Series {
  key: string;
  label: string;
  color: string;
  points: number[];
}

const W = 640;
const H = 220;
const PAD = { l: 36, r: 12, t: 12, b: 26 };

export function LineChart({ labels, series, unit = "", title }: { labels: string[]; series: Series[]; unit?: string; title: string }) {
  const max = Math.max(1, ...series.flatMap((s) => s.points));
  const nice = Math.ceil(max / 4) * 4 || 4;
  const x = (i: number) => PAD.l + (labels.length <= 1 ? 0 : (i / (labels.length - 1)) * (W - PAD.l - PAD.r));
  const y = (v: number) => PAD.t + (1 - v / nice) * (H - PAD.t - PAD.b);
  const ticks = [0, 1, 2, 3, 4].map((i) => (nice / 4) * i);
  const every = Math.max(1, Math.ceil(labels.length / 8));

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={title}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="var(--chart-grid)" strokeWidth={1} />
            <text x={PAD.l - 6} y={y(t) + 3.5} textAnchor="end" fontSize={10} fill="var(--chart-axis-ink)" className="font-mono">{Math.round(t * 10) / 10}</text>
          </g>
        ))}
        {labels.map((l, i) => (i % every === 0 ? <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize={10} fill="var(--chart-axis-ink)" className="font-mono">{l}</text> : null))}
        {series.map((s) => (
          <g key={s.key}>
            <polyline fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" points={s.points.map((v, i) => `${x(i)},${y(v)}`).join(" ")} />
            {s.points.map((v, i) => (
              <circle key={i} cx={x(i)} cy={y(v)} r={4} fill="var(--surface)" stroke={s.color} strokeWidth={2}>
                <title>{`${s.label} · ${labels[i]}: ${v}${unit}`}</title>
              </circle>
            ))}
          </g>
        ))}
      </svg>
      <figcaption className="mt-1 flex flex-wrap gap-4">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-[12px] text-ink-2">
            <span className="h-[3px] w-4 rounded" style={{ background: s.color }} aria-hidden="true" />
            {s.label}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
