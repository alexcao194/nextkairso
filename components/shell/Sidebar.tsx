"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  IconBulb,
  IconCalendar,
  IconChart,
  IconChat,
  IconCheckSquare,
  IconChevronDown,
  IconFolder,
  IconChevronRight,
  IconHome,
  IconInbox,
  IconPlus,
  IconSearch,
  IconUsers,
  IconArrowLeft,
  IconArrowRight,
} from "@/components/icons";
import { SidebarNavItem } from "./SidebarNavItem";
import { ThemeToggle } from "./ThemeToggle";
import { LangToggle } from "./LangToggle";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { UserMenu } from "./UserMenu";
import { CountBadge } from "@/components/ui/CountBadge";
import { IconButton } from "@/components/ui/Button";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { getWorkspaceProjectFeedbackSummary } from "@/lib/api/endpoints";
import { qk } from "@/lib/query/keys";
import { projectColor } from "@/lib/domain/format";
import { NAV_HUE } from "@/lib/domain/hue";
import { useDialogs } from "@/components/dialogs/DialogProvider";
import { useT } from "@/lib/i18n";

const PROJECT_TABS = [{ slug: "tasks" }, { slug: "board" }, { slug: "timeline" }, { slug: "modules" }, { slug: "resources" }, { slug: "feedback" }, { slug: "stats" }] as const;

const SectionLabel = ({ children, action, hidden }: { children: string; action?: React.ReactNode; hidden?: boolean }) =>
  hidden ? (
    <div className="mx-3 my-2 h-px bg-line" />
  ) : (
    <div className="flex items-center justify-between px-[19px] pb-1.5 pt-4">
      <span className="text-[10px] font-bold uppercase tracking-[0.09em] text-accent-ink/80">{children}</span>
      {action}
    </div>
  );

export function Sidebar({
  collapsed = false,
  onToggleCollapse,
  onNavigate,
}: {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { workspaceId, projects, unreadCount, myTasksCount, threadsCount, isManager } = useWorkspace();
  const { openCreateProject, openCommandPalette } = useDialogs();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [showAll, setShowAll] = useState(false);
  const tr = useT();

  const currentId = projects.find((p) => pathname.startsWith(`/projects/${p.id}`))?.id ?? null;
  const visible = showAll || collapsed ? projects : projects.slice(0, 4);

  const feedback = useQuery({
    queryKey: qk.feedbackSummary(workspaceId, currentId ?? ""),
    queryFn: () => getWorkspaceProjectFeedbackSummary(workspaceId, currentId!),
    enabled: !!workspaceId && !!currentId,
  });

  const nav = (href: string, match: (p: string) => boolean = (p) => p.startsWith(href)) => ({
    href,
    active: match(pathname),
    collapsed,
    onNavigate,
  });

  return (
    <aside className={`flex h-full shrink-0 flex-col border-r border-line bg-sidebar ${collapsed ? "w-rail" : "w-sidebar"}`}>
      <div className="shrink-0">
        <WorkspaceSwitcher collapsed={collapsed} />
        <div className={collapsed ? "flex justify-center pb-2 pt-1.5" : "px-2.5 pb-2 pt-1.5"}>
          {collapsed ? (
            <IconButton label={tr.sidebar.search} variant="ghost" size="sm" onClick={openCommandPalette}>
              <IconSearch size={15} />
            </IconButton>
          ) : (
            <button
              type="button"
              onClick={() => {
                onNavigate?.();
                openCommandPalette();
              }}
              className="flex h-ctl-sm w-full items-center gap-2 rounded-md border border-line-strong bg-surface px-2.5 text-left text-[12px] text-ink-placeholder hover:border-ink-disabled max-sm:h-11"
            >
              <IconSearch size={13} className="shrink-0 text-ink-faint" />
              <span className="flex-1">{tr.sidebarExtra.quickFind}</span>
              <kbd className="font-mono text-[10px]">⌘K</kbd>
            </button>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-3">
        <nav className={`flex flex-col gap-0.5 ${collapsed ? "px-1.5" : "px-2.5"}`} aria-label={tr.sidebarExtra.mainNav}>
          <SidebarNavItem {...nav("/", (p) => p === "/")} hue={NAV_HUE.home} icon={<IconHome />} label={tr.sidebar.overview} />
          <SidebarNavItem {...nav("/inbox")} hue={NAV_HUE.inbox} icon={<IconInbox />} label={tr.sidebar.inbox} count={unreadCount || undefined} countTone="danger" />
          <SidebarNavItem {...nav("/my-tasks")} hue={NAV_HUE.myTasks} icon={<IconCheckSquare />} label={tr.sidebar.myTasks} count={myTasksCount || undefined} />
          <SidebarNavItem {...nav("/threads")} hue={NAV_HUE.threads} icon={<IconChat />} label={tr.sidebar.threads} count={threadsCount || undefined} />
          <SidebarNavItem {...nav("/calendar")} hue={NAV_HUE.calendar} icon={<IconCalendar />} label={tr.sidebar.calendar} />
        </nav>

        <SectionLabel
          hidden={collapsed}
          action={
            <button type="button" onClick={openCreateProject} aria-label={tr.sidebar.newProject} className="text-ink-faint hover:text-ink">
              <IconPlus size={13} />
            </button>
          }
        >
          {tr.sidebar.projects}
        </SectionLabel>

        <nav className={`flex flex-col gap-0.5 ${collapsed ? "px-1.5" : "px-2.5"}`} aria-label={tr.sidebar.projects}>
          {visible.map((p) => {
            const isCurrent = p.id === currentId;
            const expanded = open[p.id] ?? isCurrent;
            const onRoute = pathname.startsWith(`/projects/${p.id}`);
            if (collapsed) {
              return (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}/tasks`}
                  title={p.name}
                  aria-current={onRoute ? "page" : undefined}
                  className={`flex h-[30px] items-center justify-center rounded-md hover:bg-hover ${onRoute ? "bg-accent-soft ring-1 ring-accent-border" : ""}`}
                >
                  <span className="size-3 rounded-[4px] shadow-sm" style={{ background: projectColor(p.id) }} />
                  <span className="sr-only">{p.name}</span>
                </Link>
              );
            }
            return (
              <div key={p.id} className="flex flex-col gap-px">
                <div
                  className={`flex h-[30px] items-center gap-2 rounded-md px-2 text-[13px] max-sm:h-11 ${
                    onRoute ? "bg-hover font-medium text-ink" : "text-ink-2 hover:bg-hover"
                  }`}
                >
                  <button
                    type="button"
                    aria-label={expanded ? tr.sidebarExtra.collapseProject(p.name) : tr.sidebarExtra.expandProject(p.name)}
                    aria-expanded={expanded}
                    onClick={() => setOpen((s) => ({ ...s, [p.id]: !expanded }))}
                    className="flex size-5 shrink-0 items-center justify-center text-ink-disabled hover:text-ink"
                  >
                    {expanded ? <IconChevronDown size={13} /> : <IconChevronRight size={13} />}
                  </button>
                  <span className="size-2.5 shrink-0 rounded-[3px] shadow-sm" style={{ background: projectColor(p.id) }} />
                  <Link href={`/projects/${p.id}/tasks`} onClick={onNavigate} className="flex-1 truncate">
                    {p.name}
                  </Link>
                  <span className="font-mono text-[11px] text-ink-placeholder">{p.taskCount}</span>
                </div>
                {expanded && (
                  <div className="flex flex-col gap-px pl-6">
                    {PROJECT_TABS.map((t) => {
                      const href = `/projects/${p.id}/${t.slug}`;
                      const active = pathname === href;
                      const badge = t.slug === "feedback" && isCurrent ? feedback.data?.pendingCount : undefined;
                      return (
                        <Link
                          key={t.slug}
                          href={href}
                          onClick={onNavigate}
                          aria-current={active ? "page" : undefined}
                          className={`flex h-[27px] items-center gap-2 rounded-md px-2.5 text-[12.5px] max-sm:h-11 ${
                            active ? "bg-accent-soft font-medium text-accent-ink" : "text-ink-2 hover:bg-hover"
                          }`}
                        >
                          <span className="flex-1 truncate">{tr.sidebar.tabs[t.slug]}</span>
                          {!!badge && <CountBadge value={badge} />}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {projects.length === 0 && !collapsed && (
            <p className="px-3 py-2 text-[12px] text-ink-muted">{tr.sidebarExtra.noProjects}</p>
          )}
          {!showAll && !collapsed && projects.length > 4 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="flex h-[26px] items-center rounded-md pl-7 pr-2.5 text-left text-[12px] text-ink-faint hover:bg-hover hover:text-ink"
            >
              {tr.sidebarExtra.showAll(projects.length)}
            </button>
          )}
        </nav>

        <SectionLabel hidden={collapsed}>Workspace</SectionLabel>
        <nav className={`flex flex-col gap-0.5 ${collapsed ? "px-1.5" : "px-2.5"}`} aria-label="Workspace">
          <SidebarNavItem {...nav("/initiatives")} hue={NAV_HUE.initiatives} icon={<IconBulb />} label={tr.sidebar.initiatives} />
          <SidebarNavItem {...nav("/files")} hue={NAV_HUE.files} icon={<IconFolder />} label={tr.sidebar.files} />
          {isManager && <SidebarNavItem {...nav("/analytics")} hue={NAV_HUE.analytics} icon={<IconChart />} label={tr.sidebar.analytics} />}
          <SidebarNavItem {...nav("/settings")} hue={NAV_HUE.settings} icon={<IconUsers />} label={tr.sidebar.settings} />
        </nav>
      </div>

      <div className={`flex shrink-0 items-center border-t border-line px-2.5 py-2 ${collapsed ? "flex-col gap-1" : "gap-1"}`}>
        <UserMenu collapsed={collapsed} />
        <LangToggle />
        <ThemeToggle />
        {onToggleCollapse && (
          <IconButton
            label={collapsed ? tr.sidebar.expand : tr.sidebar.collapse}
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="max-sm:hidden"
          >
            {collapsed ? <IconArrowRight size={14} /> : <IconArrowLeft size={14} />}
          </IconButton>
        )}
      </div>
    </aside>
  );
}
