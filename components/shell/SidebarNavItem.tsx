import Link from "next/link";
import type { ReactNode } from "react";
import { CountBadge } from "@/components/ui/CountBadge";
import { hueVars, type Hue } from "@/lib/domain/hue";

export function SidebarNavItem({
  href,
  icon,
  label,
  hue,
  count,
  countTone = "neutral",
  active = false,
  collapsed = false,
  onNavigate,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  hue: Hue;
  count?: number;
  countTone?: "danger" | "neutral" | "accent";
  active?: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      style={hueVars(hue)}
      aria-current={active ? "page" : undefined}
      title={collapsed ? label : undefined}
      className={`group relative flex h-[34px] items-center rounded-lg text-[13px] transition-colors max-sm:h-11 ${
        collapsed ? "justify-center px-0" : "gap-2.5 px-2"
      } ${active ? "bg-(--hs) font-semibold text-(--h)" : "text-ink-2 hover:bg-hover hover:text-ink"}`}
    >
      {active && !collapsed && <span className="absolute -left-2.5 top-1.5 bottom-1.5 w-[3px] rounded-full bg-(--hv)" aria-hidden="true" />}
      <span
        className={`inline-flex size-6 shrink-0 items-center justify-center rounded-md transition-colors ${
          active ? "bg-(--hv) text-white shadow-sm" : "bg-(--hs) text-(--h) group-hover:bg-(--hl)"
        }`}
      >
        {icon}
      </span>
      {collapsed ? <span className="sr-only">{label}</span> : <span className="flex-1 truncate">{label}</span>}
      {count !== undefined &&
        (collapsed ? (
          <span className="absolute right-1 top-1 size-2 rounded-full bg-danger" aria-label={`${count} mục`} />
        ) : (
          <CountBadge value={count} tone={countTone} />
        ))}
    </Link>
  );
}
