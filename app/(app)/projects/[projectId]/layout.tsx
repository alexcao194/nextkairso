"use client";

import { use, useEffect } from "react";
import { useQueries } from "@tanstack/react-query";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { getWorkspaceProjects } from "@/lib/api/endpoints";
import { fetchAll } from "@/lib/query/paged";
import { qk } from "@/lib/query/keys";
import { projectColor } from "@/lib/domain/format";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { Breadcrumb } from "@/components/shell/Breadcrumb";
import { TopBar, TopBarDivider, TopBarSpacer } from "@/components/shell/TopBar";
import { ViewTabs } from "@/components/shell/ViewTabs";
import { Button, IconButton, LinkButton } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/feedback";
import { TaskDetailPanel } from "@/components/kairso/TaskDetailPanel";
import { useDialogs } from "@/components/dialogs/DialogProvider";
import { IconPlus, IconSettings } from "@/components/icons";
import { tr } from "@/lib/i18n";

export default function ProjectLayout({ children, params }: { children: React.ReactNode; params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const { workspace, workspaces, workspaceId, projects, projectById, setWorkspaceId, isLoading } = useWorkspace();
  const { openCreateTask } = useDialogs();
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const project = projectById(projectId);
  const base = `/projects/${projectId}`;
  const onFullTaskPage = /\/tasks\/[^/]+$/.test(pathname);
  const taskId = onFullTaskPage ? null : sp.get("task");

  const others = workspaces.filter((w) => w.id !== workspaceId);
  const probes = useQueries({
    queries: others.map((w) => ({
      queryKey: qk.projects(w.id),
      queryFn: () => fetchAll((q) => getWorkspaceProjects(w.id, q)),
      enabled: !project && !isLoading && projects !== undefined,
    })),
  });
  useEffect(() => {
    if (project) return;
    const idx = probes.findIndex((p) => p.data?.some((x) => x.id === projectId));
    if (idx >= 0) setWorkspaceId(others[idx].id);
  }, [probes, project, projectId, others, setWorkspaceId]);

  const closePanel = () => {
    const next = new URLSearchParams(sp.toString());
    next.delete("task");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const stillLooking = !project && probes.some((p) => p.isLoading);
  if (!project && !isLoading) {
    return stillLooking ? (
      <div className="p-6"><Skeleton className="h-6 w-56" /></div>
    ) : (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-[15px] font-semibold">{tr().projLayout.notFound}</p>
        <p className="max-w-[360px] text-[13px] text-ink-muted">{tr().projLayout.notFoundDesc}</p>
        <LinkButton href="/">{tr().projLayout.backHome}</LinkButton>
      </div>
    );
  }

  return (
    <>
      <TopBar>
        <Breadcrumb
          items={[
            { label: workspace?.name ?? "Kairso", href: "/" },
            { label: project?.name ?? "…", dotColor: projectColor(projectId) },
          ]}
        />
        <TopBarDivider />
        <div className="max-sm:hidden">
          <ViewTabs
            tabs={[
              { href: `${base}/tasks`, label: tr().sidebar.tabs.tasks },
              { href: `${base}/board`, label: "Board" },
              { href: `${base}/timeline`, label: "Timeline" },
            ]}
          />
        </div>
        <TopBarSpacer />
        <IconButton label={tr().projLayout.settings} variant="ghost" onClick={() => router.push(`${base}/settings`)}>
          <IconSettings size={15} />
        </IconButton>
        <Button variant="primary" onClick={() => openCreateTask({ projectId })} className="max-sm:hidden">
          <IconPlus size={14} /> {tr().projLayout.newTask}
        </Button>
      </TopBar>
      {/* Mobile: tab Task/Board/Timeline nằm dưới thanh trên. */}
      <div className="border-b border-line bg-surface px-3 py-1.5 sm:hidden">
        <ViewTabs
          tabs={[
            { href: `${base}/tasks`, label: tr().sidebar.tabs.tasks },
            { href: `${base}/board`, label: "Board" },
            { href: `${base}/timeline`, label: "Timeline" },
          ]}
        />
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
        {taskId && <TaskDetailPanel taskId={taskId} onClose={closePanel} />}
      </div>
      <button
        type="button"
        onClick={() => openCreateTask({ projectId })}
        className="fixed bottom-[76px] right-4 z-30 inline-flex h-12 items-center gap-2 rounded-full bg-accent px-5 text-[14px] font-medium text-accent-on shadow-overlay sm:hidden"
      >
        <IconPlus size={16} /> {tr().projLayout.newTask}
      </button>
    </>
  );
}
