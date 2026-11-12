"use client";

import { use, useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { getWorkspaceTaskStatistics } from "@/lib/api/endpoints";
import type { TaskStatsMemberResponse } from "@/lib/api/schema";
import { qk } from "@/lib/query/keys";
import { monthKey } from "@/lib/domain/format";
import { useTaskStats } from "@/lib/hooks/stats";
import { useProjectModules } from "@/lib/hooks/tasks";
import { useUrlState } from "@/lib/hooks/useUrlState";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { Select } from "@/components/ui/form";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/feedback";
import { StackedBar } from "@/components/charts/StackedBar";
import { statusSegments } from "@/components/charts/statusSegments";
import { prioritySegments } from "@/components/charts/prioritySegments";
import { BarList } from "@/components/charts/BarList";
import { LineChart } from "@/components/charts/LineChart";
import { MetricStrip } from "@/components/kairso/MetricStrip";
import { workloadBalance } from "@/lib/domain/analytics";
import { IconChart } from "@/components/icons";
import { tr } from "@/lib/i18n";
import { monthTitle } from "@/lib/domain/format";

const r1 = (n: number) => Math.round(n * 10) / 10;
const months = (n: number) => {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => monthKey(new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1)));
};

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-lg border border-line bg-surface p-4">
    <h2 className="mb-3 text-[13px] font-semibold">{title}</h2>
    {children}
  </section>
);

export default function ProjectStatsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const { workspaceId } = useWorkspace();
  const [month, setMonth] = useUrlState("month", "all");
  const [moduleId, setModuleId] = useUrlState("moduleId", "");
  const modules = useProjectModules(workspaceId, projectId);
  const q = useTaskStats(workspaceId, { projectId, moduleId: moduleId || undefined, month: month === "all" ? undefined : month });
  const t = q.data?.totals;
  const members = [...(q.data?.members ?? [])].sort((a, b) => b.totalTasks - a.totalTasks);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="flex h-toolbar shrink-0 items-center gap-2 border-b border-line bg-surface px-4">
        <Select small aria-label={tr().projStats.period} className="w-40" value={month} onChange={(e) => setMonth(e.target.value)}>
          <option value="all">{tr().projStats.allTime}</option>
          {months(12).map((m) => <option key={m} value={m}>{monthTitle(new Date(Number(m.slice(0, 4)), Number(m.slice(5)) - 1, 1))}</option>)}
        </Select>
        <Select small aria-label="Module" className="w-48" value={moduleId} onChange={(e) => setModuleId(e.target.value || null)}>
          <option value="">{tr().projStats.allModules}</option>
          {(modules.data ?? []).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </Select>
      </div>
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-5 p-5">
        {q.isLoading ? (
          <Skeleton className="h-[58px]" />
        ) : q.isError ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        ) : !t || t.totalTasks === 0 ? (
          <EmptyState icon={<IconChart size={28} />} title={tr().projStats.none} description={tr().projStats.noneDesc} />
        ) : (
          <>
            <MetricStrip
              metrics={[
                { label: tr().projStats.total, value: t.totalTasks },
                { label: tr().projStats.done, value: t.done, hint: `${Math.round((t.done / t.totalTasks) * 100)}%` },
                { label: tr().projStats.doneLate, value: t.totalOverdue, hint: tr().projStats.doneLateHint, tone: t.totalOverdue > 0 ? "danger" : "default" },
                { label: tr().projStats.avgCycle, value: t.cycleTimeSampleSize > 0 ? r1(t.avgCycleDays) : "—", hint: t.cycleTimeSampleSize > 0 ? tr().projStats.cycleHint(t.cycleTimeSampleSize) : undefined },
                { label: tr().projStats.estHours, value: r1(t.totalEstimation), hint: "h" },
                { label: tr().projStats.lateHours, value: r1(t.totalLate), hint: tr().projStats.lateHoursHint },
                { label: tr().projStats.bugHours, value: r1(t.totalBug), hint: "h" },
              ]}
            />

            <div className="grid grid-cols-2 gap-5 max-lg:grid-cols-1">
              <Card title={tr().projStats.statusDist}>
                <StackedBar label={tr().projStats.statusDist} segments={statusSegments(t)} height={12} />
              </Card>
              <Card title={tr().projStats.priorityDist}>
                <StackedBar label={tr().projStats.priorityDist} segments={prioritySegments(t)} height={12} />
              </Card>
            </div>

            <div className="grid grid-cols-2 gap-5 max-lg:grid-cols-1">
              <Card title={tr().projStats.estByMember}>
                <WorkloadCard members={members} />
              </Card>
              <Card title={tr().projStats.trend}>
                <ProjectTrend projectId={projectId} moduleId={moduleId || undefined} />
              </Card>
            </div>

            {!moduleId && (modules.data?.length ?? 0) > 0 && (
              <Card title="Theo module">
                <ModuleBreakdown projectId={projectId} />
              </Card>
            )}

            <section aria-labelledby="st-mem" className="rounded-lg border border-line bg-surface">
              <h2 id="st-mem" className="border-b border-line px-4 py-3 text-[13px] font-semibold">{tr().projStats.contribution}</h2>
              <MemberTable members={members} />
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function WorkloadCard({ members }: { members: TaskStatsMemberResponse[] }) {
  const rows = members.map((m) => ({ key: m.memberId, label: m.memberName, value: r1(m.totalEstimation) }));
  if (rows.length === 0) return <p className="text-[13px] text-ink-muted">{tr().projStats.noData}</p>;
  const b = workloadBalance(rows);
  const verdict = rows.length < 2 ? null : b.cv < 0.15 ? tr().projStats.even : b.cv < 0.4 ? tr().projStats.moderate : tr().projStats.uneven;
  return (
    <div className="flex flex-col gap-3">
      <BarList label={tr().projStats.estByMember} unit="h" color="var(--chart-2)" rows={rows.slice(0, 8)} />
      {verdict && (
        <p className="border-t border-line pt-2 text-[12px] text-ink-muted">
          {tr().projStats.balance(String(r1(b.mean)), Math.round(b.cv * 100), verdict)}
          {b.max && b.min && b.max.key !== b.min.key && tr().projStats.extremes(b.max.label, String(r1(b.max.value)), b.min.label, String(r1(b.min.value)))}
        </p>
      )}
    </div>
  );
}

function ProjectTrend({ projectId, moduleId }: { projectId: string; moduleId?: string }) {
  const { workspaceId } = useWorkspace();
  const ms = useMemo(() => months(6), []);
  const res = useQueries({
    queries: ms.map((m) => ({
      queryKey: qk.stats(workspaceId, "project-trend", { projectId, moduleId, m }),
      queryFn: () => getWorkspaceTaskStatistics(workspaceId, { projectId, moduleId, month: m }),
    })),
  });
  if (res.some((r) => r.isLoading)) return <Skeleton className="h-40" />;
  return (
    <LineChart
      title={tr().projStats.byMonth}
      labels={ms.map((m) => `T${m.slice(5)}`)}
      series={[
        { key: "total", label: tr().projStats.total, color: "var(--chart-1)", points: res.map((r) => r.data?.totals?.totalTasks ?? 0) },
        { key: "done", label: tr().projStats.done, color: "var(--chart-2)", points: res.map((r) => r.data?.totals?.done ?? 0) },
      ]}
    />
  );
}

function ModuleBreakdown({ projectId }: { projectId: string }) {
  const { workspaceId } = useWorkspace();
  const modules = useProjectModules(workspaceId, projectId);
  const list = modules.data ?? [];
  const res = useQueries({
    queries: list.map((m) => ({
      queryKey: qk.stats(workspaceId, "module", { projectId, moduleId: m.id }),
      queryFn: () => getWorkspaceTaskStatistics(workspaceId, { projectId, moduleId: m.id }),
    })),
  });
  if (modules.isLoading || res.some((r) => r.isLoading)) return <Skeleton className="h-32" />;
  const rows = list
    .map((m, i) => ({ key: m.id, label: m.name, value: res[i]?.data?.totals?.totalTasks ?? 0 }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);
  return rows.length === 0 ? (
    <p className="text-[13px] text-ink-muted">{tr().projStats.noModuleTasks}</p>
  ) : (
    <BarList label={tr().projStats.byModule} rows={rows} />
  );
}

function MemberTable({ members }: { members: TaskStatsMemberResponse[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-[13px]">
        <thead className="text-left text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          <tr className="h-thead border-b border-line">
            <th className="px-4">{tr().projStats.member}</th>
            <th className="w-[280px] px-2">{tr().projStats.status}</th>
            <th className="px-2 text-right">Task</th>
            <th className="px-2 text-right" title={tr().projStats.doneLateCount}>{tr().projStats.late}</th>
            <th className="px-2 text-right">{tr().projStats.estHours}</th>
            <th className="px-2 text-right" title={tr().projStats.lateHoursTitle}>{tr().projStats.lateH}</th>
            <th className="px-4 text-right">{tr().projStats.fault}</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.memberId} className="h-12 border-b border-line-row">
              <td className="px-4"><span className="flex items-center gap-2"><Avatar person={{ id: m.memberId, name: m.memberName, avatar: m.memberAvatar }} /> {m.memberName}</span></td>
              <td className="px-2"><StackedBar label={tr().projStats.statusOf(m.memberName)} segments={statusSegments(m)} showLegend={false} height={8} /></td>
              <td className="px-2 text-right font-mono">{m.totalTasks}</td>
              <td className={`px-2 text-right font-mono ${m.totalOverdue > 0 ? "text-danger" : ""}`}>{m.totalOverdue}</td>
              <td className="px-2 text-right font-mono">{r1(m.totalEstimation)}h</td>
              <td className="px-2 text-right font-mono">{r1(m.totalLate)}h</td>
              <td className="px-4 text-right font-mono">{r1(m.totalBug)}h</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
