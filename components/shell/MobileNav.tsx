"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { IconCalendar, IconCheckSquare, IconHome, IconInbox, IconMenu } from "@/components/icons";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { tr } from "@/lib/i18n";

export function MobileNav({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const { unreadCount, myTasksCount } = useWorkspace();
  const tabs: Array<{ href: string; label: string; icon: ReactNode; badge?: number; match: (p: string) => boolean }> = [
    { href: "/", label: tr().mobileNav.overview, icon: <IconHome size={20} />, match: (p) => p === "/" },
    { href: "/inbox", label: tr().mobileNav.inbox, icon: <IconInbox size={20} />, badge: unreadCount, match: (p) => p.startsWith("/inbox") },
    { href: "/my-tasks", label: "Task", icon: <IconCheckSquare size={20} />, badge: myTasksCount, match: (p) => p.startsWith("/my-tasks") },
    { href: "/calendar", label: tr().mobileNav.calendar, icon: <IconCalendar size={20} />, match: (p) => p.startsWith("/calendar") },
  ];
  const cls = "relative flex h-[60px] flex-1 flex-col items-center justify-center gap-0.5 text-[10.5px]";
  return (
    <nav aria-label={tr().mobileNav.label} className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-surface sm:hidden">
      {tabs.map((t) => {
        const active = t.match(pathname);
        return (
          <Link key={t.href} href={t.href} aria-current={active ? "page" : undefined} className={`${cls} ${active ? "font-medium text-accent-ink" : "text-ink-muted"}`}>
            {t.icon}
            {t.label}
            {!!t.badge && (
              <span className="absolute right-[calc(50%-18px)] top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
                {t.badge > 99 ? "99+" : t.badge}
              </span>
            )}
          </Link>
        );
      })}
      <button type="button" onClick={onMenu} className={`${cls} text-ink-muted`}>
        <IconMenu size={20} />
        {tr().mobileNav.more}
      </button>
    </nav>
  );
}
