export function BarList({ rows, unit = "", color = "var(--chart-1)", label }: { rows: Array<{ key: string; label: string; value: number; sub?: string }>; unit?: string; color?: string; label: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul aria-label={label} className="flex flex-col gap-2">
      {rows.map((r) => (
        <li key={r.key} className="grid grid-cols-[minmax(80px,160px)_1fr_64px] items-center gap-3 text-[12.5px]">
          <span className="truncate text-ink-2" title={r.label}>{r.label}</span>
          <span className="h-2 rounded-full bg-hover">
            <span className="block h-full rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: color, minWidth: r.value > 0 ? 3 : 0 }} />
          </span>
          <span className="text-right font-mono text-ink">{Number.isInteger(r.value) ? r.value : r.value.toFixed(1)}{unit}</span>
        </li>
      ))}
    </ul>
  );
}
