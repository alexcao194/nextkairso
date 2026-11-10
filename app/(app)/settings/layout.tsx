"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { Breadcrumb } from "@/components/shell/Breadcrumb";
import { TopBar, TopBarSpacer } from "@/components/shell/TopBar";
import { SETTINGS_NAV } from "@/components/settings/nav";
import { hueVars, type Hue } from "@/lib/domain/hue";

const GROUP_HUE: Record<string, Hue> = { "Con người": "violet", "Workspace": "blue", "Vận hành": "orange", "Hệ thống": "teal" };

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { workspace, isHolder } = useWorkspace();
  const current = pathname.split("/")[2] ?? "members";
  return (
    <>
      <TopBar><Breadcrumb items={[{ label: workspace?.name ?? "Workspace", href: "/" }, { label: "Cài đặt" }]} /><TopBarSpacer /></TopBar>
      <div className="flex min-h-0 flex-1 max-md:flex-col">
        <nav aria-label="Mục cài đặt" className="w-[216px] shrink-0 overflow-y-auto border-r border-line bg-surface px-2.5 py-3 max-md:flex max-md:w-full max-md:gap-1 max-md:overflow-x-auto max-md:border-b max-md:border-r-0 max-md:py-2">
          {SETTINGS_NAV.map((g) => (
            <div key={g.group} style={hueVars(GROUP_HUE[g.group] ?? "blue")} className="mb-3 max-md:mb-0 max-md:flex max-md:gap-1">
              <p className="flex items-center gap-1.5 px-2.5 pb-1 text-[10px] font-bold uppercase tracking-[0.09em] text-(--h) max-md:hidden"><span className="size-1.5 rounded-full bg-(--hv)" aria-hidden="true" />{g.group}</p>
              {g.items.filter((i) => !i.managerOnly || isHolder).map((i) => (
                <Link key={i.slug} href={`/settings/${i.slug}`} aria-current={current === i.slug ? "page" : undefined} className={`flex h-8 items-center whitespace-nowrap rounded-md px-2.5 text-[13px] ${current === i.slug ? "bg-(--hs) font-semibold text-(--h)" : "text-ink-2 hover:bg-hover"}`}>{i.label}</Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto"><div className="mx-auto w-full max-w-[860px] p-5 max-sm:p-3">{children}</div></div>
      </div>
    </>
  );
}
