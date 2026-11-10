"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CountBadge } from "@/components/ui/CountBadge";

type ViewTab = { href: string; label: string; count?: number };

export function ViewTabs({ tabs }: { tabs: ViewTab[] }) {
  const pathname = usePathname();
  return (
    <div className="flex items-center gap-0.5">
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex h-[26px] items-center gap-1.5 rounded-md px-2.5 text-[12.5px] ${
              active ? "bg-hover font-medium text-ink" : "text-ink-muted hover:bg-hover hover:text-ink"
            }`}
          >
            {t.label}
            {t.count !== undefined && <CountBadge value={t.count} />}
          </Link>
        );
      })}
    </div>
  );
}
