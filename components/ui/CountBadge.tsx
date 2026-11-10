type Tone = "danger" | "neutral" | "accent";

const toneClass: Record<Tone, string> = {
  danger: "bg-rose-vivid text-white shadow-sm",
  neutral: "bg-hover text-ink-2",
  accent: "bg-accent-soft text-accent-ink",
};

export function CountBadge({ value, tone = "neutral" }: { value: number | string; tone?: Tone }) {
  return (
    <span className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${toneClass[tone]}`}>
      {value}
    </span>
  );
}
