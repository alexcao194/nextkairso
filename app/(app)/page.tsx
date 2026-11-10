"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQueries } from "@tanstack/react-query";
import { getWorkspaceProjectFeedbackSummary } from "@/lib/api/endpoints";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { qk } from "@/lib/query/keys";
import { isDueToday, isOverdue, localDateKey } from "@/lib/domain/task";
import { notificationHref, notificationKind, KIND_HUE, KIND_LABEL, type NotificationKind } from "@/lib/domain/notification";
import { hueVars } from "@/lib/domain/hue";
import { fmtRelative, projectColor, startOfWeek } from "@/lib/domain/format";
import { useMyTasks, useNotifications, useProjectOverviews, useWorkspaceHistory } from "@/lib/hooks/workspaceData";
import { useCheckRequests, useMyCalendar, usePendingSchedules } from "@/lib/hooks/attendance";
import { TopBar, TopBarSpacer } from "@/components/shell/TopBar";
import { Breadcrumb } from "@/components/shell/Breadcrumb";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { MetricStrip } from "@/components/kairso/MetricStrip";
import { PriorityTag } from "@/components/kairso/PriorityTag";
import { ResourcePanel } from "@/components/kairso/ResourcePanel";
import { useDialogs } from "@/components/dialogs/DialogProvider";
import { IconTile } from "@/components/ui/IconTile";
import { IconAlert, IconCheckSquare, IconCircleCheck, IconClock, IconFolder, IconInbox, IconPlus, IconZap, IconBell } from "@/components/icons";

interface Item {
  id: string;
  kind: "overdue" | "due" | "approval" | "feedback" | "attendance" | NotificationKind;
  code?: string;
  title: string;
  meta: string;
  href: string;
  action?: string;
  priority?: number;
}

const KIND_TEXT: Record<string, string> = { ...KIND_LABEL, overdue: "Quá hạn", due: "Đến hạn", approval: "Chờ duyệt", feedback: "Phản hồi", attendance: "Chấm công" };

export default function HomePage() {
  const { workspace, workspaceId, projects, isManager, memberById } = useWorkspace();
  const { user } = useAuth();
  const { openCreateTask, openCheckIn } = useDialogs();
  const today = localDateKey();

  const mine = useMyTasks(workspaceId);
  const notifs = useNotifications(workspaceId, 30);
  const overviews = useProjectOverviews(workspaceId, projects.map((p) => p.id));
  const history = useWorkspaceHistory(workspaceId);
  const calendar = useMyCalendar(workspaceId, today, today);
  const pendingSchedules = usePendingSchedules(workspaceId, isManager);
  const checkReqs = useCheckRequests(workspaceId, "all", "pending");
  const feedbackSummaries = useQueries({
    queries: (isManager ? projects : []).map((p) => ({
      queryKey: qk.feedbackSummary(workspaceId, p.id),
      queryFn: () => getWorkspaceProjectFeedbackSummary(workspaceId, p.id),
    })),
  });

  const tasks = useMemo(() => (mine.data ?? []).filter((t) => !t.archived), [mine.data]);
  const active = useMemo(() => tasks.filter((t) => t.status !== "done" && t.status !== "canceled"), [tasks]);
  const overdue = useMemo(() => active.filter(isOverdue), [active]);
  const weekStart = localDateKey(startOfWeek(new Date()));
  const doneThisWeek = tasks.filter((t) => t.status === "done" && localDateKey(new Date(t.firstCompletedAt ?? t.updatedAt)) >= weekStart);
  const sessions = calendar.data?.[0]?.sessions ?? [];
  const checkedIn = sessions.some((s) => s.checkIn);
  const checkedOut = sessions.some((s) => s.checkOut);

  const items = useMemo<Item[]>(() => {
    const out: Item[] = [];
    for (const t of overdue.slice(0, 8))
      out.push({ id: `o-${t.id}`, kind: "overdue", code: t.code, title: t.title, meta: `Hạn ${new Date(t.endDate!).toLocaleDateString("vi-VN")}`, href: `/projects/${t.projectId}/tasks?task=${t.id}`, priority: t.priority });
    for (const t of active.filter((x) => isDueToday(x) && !isOverdue(x)).slice(0, 5))
      out.push({ id: `d-${t.id}`, kind: "due", code: t.code, title: t.title, meta: "Hạn hôm nay", href: `/projects/${t.projectId}/tasks?task=${t.id}`, priority: t.priority });
    feedbackSummaries.forEach((q, i) => {
      const n = q.data?.pendingCount ?? 0;
      if (n > 0) out.push({ id: `f-${projects[i].id}`, kind: "feedback", title: `${n} phản hồi chờ xử lý`, meta: projects[i].name, href: `/projects/${projects[i].id}/feedback`, action: "Mở" });
    });
    if ((pendingSchedules.data?.length ?? 0) > 0)
      out.push({ id: "ps", kind: "attendance", title: `${pendingSchedules.data!.length} ngày lịch làm việc chờ duyệt`, meta: "Lịch làm việc", href: "/calendar?tab=pending", action: "Duyệt" });
    if ((checkReqs.data?.length ?? 0) > 0)
      out.push({ id: "cr", kind: "attendance", title: `${checkReqs.data!.length} yêu cầu bổ sung công chờ duyệt`, meta: "Yêu cầu bổ sung công", href: "/calendar?tab=requests", action: "Duyệt" });
    for (const n of (notifs.data ?? []).filter((x) => !x.readAt).slice(0, 8)) {
      const href = notificationHref(n);
      if (href) out.push({ id: `n-${n.id}`, kind: notificationKind(n.data?.type), title: n.title, meta: `${n.body} · ${fmtRelative(n.createdAt)}`, href });
    }
    return out;
  }, [overdue, active, feedbackSummaries, projects, pendingSchedules.data, checkReqs.data, notifs.data]);

  const loading = mine.isLoading;

  return (
    <>
      <TopBar>
        <Breadcrumb items={[{ label: workspace?.name ?? "Kairso" }, { label: "Tổng quan" }]} />
        <TopBarSpacer />
        <Button variant="primary" onClick={() => openCreateTask()} className="max-sm:hidden"><IconPlus size={14} /> Tạo task</Button>
      </TopBar>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 p-5 max-sm:p-4">
          <section
            aria-labelledby="home-hello"
            style={{ background: "var(--hero-grad)" }}
            className="relative overflow-hidden rounded-2xl px-6 py-5 text-white shadow-md"
          >
            <span className="pointer-events-none absolute -right-10 -top-16 size-56 rounded-full bg-white/15" aria-hidden="true" />
            <span className="pointer-events-none absolute -bottom-20 right-24 size-44 rounded-full bg-white/10" aria-hidden="true" />
            <span className="pointer-events-none absolute right-6 top-6 hidden text-white/90 sm:block" aria-hidden="true"><IconZap size={44} /></span>
            <p className="text-[12.5px] font-medium text-white/85">{new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}</p>
            <h1 id="home-hello" className="mt-0.5 text-[24px] font-bold leading-tight">Xin chào, {user?.nickname || user?.name?.split(" ").slice(-1)[0] || "bạn"}!</h1>
            <p className="mt-1 max-w-[520px] text-[13.5px] text-white/90">
              {loading
                ? "Đang tổng hợp công việc của bạn…"
                : items.length === 0
                  ? "Mọi việc đã gọn gàng — không có gì cần bạn xử lý lúc này."
                  : `Bạn có ${items.length} việc cần xử lý${overdue.length ? `, trong đó ${overdue.length} task quá hạn` : ""}.`}
            </p>
            <div className="mt-3.5 flex flex-wrap gap-2">
              <button type="button" onClick={openCheckIn} className="inline-flex h-ctl items-center gap-1.5 rounded-lg bg-white px-3.5 text-[13px] font-semibold text-on-white shadow-sm transition hover:bg-white/90">
                <IconClock size={14} /> {checkedIn && !checkedOut ? "Check out" : "Check in"}
              </button>
              <button type="button" onClick={() => openCreateTask()} className="inline-flex h-ctl items-center gap-1.5 rounded-lg border border-white/40 bg-white/15 px-3.5 text-[13px] font-medium text-white backdrop-blur transition hover:bg-white/25">
                <IconPlus size={14} /> Tạo task
              </button>
            </div>
          </section>

          <MetricStrip
            metrics={[
              { label: "Task đang chạy", value: loading ? "…" : active.length, hue: "blue", icon: <IconCheckSquare size={17} /> },
              { label: "Quá hạn", value: loading ? "…" : overdue.length, tone: overdue.length > 0 ? "danger" : "default", hue: "rose", icon: <IconAlert size={17} /> },
              { label: "Xong tuần này", value: loading ? "…" : doneThisWeek.length, hue: "green", icon: <IconCircleCheck size={17} /> },
              { label: "Chấm công hôm nay", value: calendar.isLoading ? "…" : checkedOut ? "Đủ" : checkedIn ? "Đã vào" : "Chưa", hue: "orange", icon: <IconClock size={17} /> },
            ]}
          />

          <div className="grid grid-cols-[1.85fr_1fr] gap-4 max-lg:grid-cols-1">
            <div className="flex min-w-0 flex-col gap-4">
              <section aria-labelledby="h-act" className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
                <h2 id="h-act" className="flex h-12 items-center gap-2.5 border-b border-line px-4 text-[14px] font-semibold">
                  <IconTile hue="violet" size={26}><IconBell size={14} /></IconTile>
                  Cần bạn xử lý {items.length > 0 && <span className="rounded-full bg-violet-soft px-2 font-mono text-[12px] font-semibold text-violet">{items.length}</span>}
                </h2>
                {loading ? (
                  <div className="flex flex-col gap-2 p-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-9" />)}</div>
                ) : items.length === 0 ? (
                  <EmptyState icon={<IconCircleCheck size={26} />} title="Không có gì cần xử lý" description="Mọi việc đã gọn gàng." className="py-10" />
                ) : (
                  <ul>
                    {items.map((it) => (
                      <li key={it.id} className="border-b border-line-row last:border-b-0">
                        <Link href={it.href} className="grid min-h-11 grid-cols-[104px_74px_1fr_auto] items-center gap-3 px-4 py-1.5 hover:bg-row-hover max-sm:grid-cols-[96px_1fr_auto]">
                          <span style={hueVars(KIND_HUE[it.kind] ?? "blue")} className="inline-flex h-5 w-fit items-center gap-1.5 whitespace-nowrap rounded-full bg-(--hs) px-2 text-[11px] font-semibold text-(--h)"><span className="size-1.5 rounded-full bg-(--hv)" aria-hidden="true" />{KIND_TEXT[it.kind]}</span>
                          <span className="truncate font-mono text-[11.5px] text-ink-faint max-sm:hidden">{it.code ?? ""}</span>
                          <span className="min-w-0">
                            <span className="block truncate text-[13px] font-medium text-ink">{it.title}</span>
                            <span className="block truncate text-[11.5px] text-ink-faint">{it.meta}</span>
                          </span>
                          <span className="flex items-center gap-2">
                            {it.priority ? <PriorityTag priority={it.priority} showLabel={false} /> : null}
                            {it.action && <span className="text-[12px] font-medium text-accent-ink">{it.action}</span>}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section aria-labelledby="h-hist" className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
                <h2 id="h-hist" className="flex h-12 items-center gap-2.5 border-b border-line px-4 text-[14px] font-semibold"><IconTile hue="cyan" size={26}><IconZap size={14} /></IconTile>Hoạt động gần đây</h2>
                {history.isLoading ? (
                  <div className="p-3"><Skeleton className="h-24" /></div>
                ) : (history.data ?? []).length === 0 ? (
                  <p className="px-4 py-6 text-center text-[13px] text-ink-muted">Chưa có hoạt động</p>
                ) : (
                  <ul>
                    {(history.data ?? []).map((h) => (
                      <li key={h.id} className="flex h-[34px] items-center gap-2 px-4 text-[12.5px]">
                        <Avatar person={{ id: h.changedBy.id, name: h.changedBy.name, avatar: h.changedBy.avatar }} size="xs" />
                        <span className="truncate"><span className="font-medium">{memberById(h.changedBy.id)?.userName ?? h.changedBy.name}</span> <span className="text-ink-muted">cập nhật {h.field}</span></span>
                        <span className="ml-auto shrink-0 text-[11.5px] text-ink-faint">{fmtRelative(h.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <div className="flex min-w-0 flex-col gap-4">
              <section aria-labelledby="h-proj" className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
                <h2 id="h-proj" className="flex h-12 items-center gap-2.5 border-b border-line px-4 text-[14px] font-semibold"><IconTile hue="teal" size={26}><IconFolder size={14} /></IconTile>Dự án</h2>
                {projects.length === 0 ? (
                  <EmptyState title="Chưa có dự án" className="py-8" />
                ) : (
                  <ul>
                    {projects.map((p) => {
                      const o = overviews.data?.find((x) => x.project.id === p.id);
                      const total = o ? o.taskCount - o.taskStatusCounts.canceled : p.taskCount;
                      const done = o?.taskStatusCounts.done ?? 0;
                      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                      return (
                        <li key={p.id} className="border-b border-line-row last:border-b-0">
                          <Link href={`/projects/${p.id}/tasks`} className="flex flex-col gap-1.5 px-4 py-2.5 hover:bg-row-hover">
                            <span className="flex items-center gap-2 text-[13px] font-medium">
                              <span className="size-2 rounded-[2px]" style={{ background: projectColor(p.id) }} />
                              <span className="flex-1 truncate">{p.name}</span>
                              <span className="font-mono text-[11.5px] font-normal text-ink-muted">{done}/{total}</span>
                            </span>
                            <span className="h-1.5 rounded-full bg-hover" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Tiến độ ${p.name}`}>
                              <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: projectColor(p.id) }} />
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
              <ResourcePanel scope={{ ws: workspaceId }} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
