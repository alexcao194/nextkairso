"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useQueries, useQuery } from "@tanstack/react-query";
import type { MemberTaskBrief, TaskStatus } from "@/lib/api/schema";
import { getWorkspaceKpi } from "@/lib/api/endpoints";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { useUrlState } from "@/lib/hooks/useUrlState";
import { useKpi, useMemberBreakdown } from "@/lib/hooks/performance";
import { useTaskStats } from "@/lib/hooks/stats";
import { useMemberCalendar } from "@/lib/hooks/attendance";
import { fetchKpiRecords } from "@/lib/kpi/kpiRecords";
import { qk } from "@/lib/query/keys";
import { dayInfo } from "@/lib/domain/attendance";
import { monthKey, fmtDate, fmtDayMonth } from "@/lib/domain/format";
import { PRIORITY_META, priorityLevel } from "@/lib/domain/task";
import { statusSegments } from "@/components/charts/statusSegments";
import { prioritySegments } from "@/components/charts/prioritySegments";
import { StackedBar } from "@/components/charts/StackedBar";
import { BarList } from "@/components/charts/BarList";
import { LineChart } from "@/components/charts/LineChart";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, EmptyState, Skeleton } from "@/components/ui/feedback";
import { Select } from "@/components/ui/form";
import { StatusChip } from "@/components/kairso/StatusChip";
import { TopBar, TopBarSpacer } from "@/components/shell/TopBar";
import { Breadcrumb } from "@/components/shell/Breadcrumb";
import { IconChart } from "@/components/icons";

const months = () => Array.from({ length: 12 }, (_, i) => monthKey(new Date(new Date().getFullYear(), new Date().getMonth() - i, 1)));
const r1 = (n: number) => Math.round(n * 10) / 10;
function monthDays(month: string) {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, "0")}` };
}

export default function MemberDetailPage({ params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = use(params);
  const { workspaceId, memberById } = useWorkspace();
  const [month, setMonth] = useUrlState("month", monthKey(new Date()));

  const kpiList = useKpi(workspaceId, month, memberId);
  const k = kpiList.data?.[0];
  const breakdown = useMemberBreakdown(workspaceId, memberId, month);
  const stats = useTaskStats(workspaceId, { memberId, month });
  const { from, to } = monthDays(month);
  const calendar = useMemberCalendar(workspaceId, memberId, from, to);
  const records = useQuery({ queryKey: [...qk.kpi(workspaceId, "records", { memberId, month })], queryFn: () => fetchKpiRecords(workspaceId, month, memberId), enabled: !!workspaceId && !!memberId });
  const rec = records.data?.get(memberId);

  const trendMonths = useMemo(() => Array.from({ length: 6 }, (_, i) => monthKey(new Date(new Date().getFullYear(), new Date().getMonth() - (5 - i), 1))), []);
  const trend = useQueries({
    queries: trendMonths.map((m) => ({ queryKey: qk.kpi(workspaceId, "trend", { memberId, month: m }), queryFn: () => getWorkspaceKpi(workspaceId, { month: m, memberId }), enabled: !!workspaceId })),
  });

  const member = memberById(memberId);
  const name = k?.memberName ?? member?.userName ?? "Nhân viên";
  const avatar = k?.memberAvatar ?? member?.userAvatar;
  const totals = stats.data?.totals;

  const attnDays = useMemo(() => {
    const out: Array<{ key: string; late: boolean; early: boolean; hours: number }> = [];
    for (const d of calendar.data ?? []) {
      const key = d.date.slice(0, 10);
      const info = dayInfo(d, key);
      if (info.isLate || info.isEarlyLeave) out.push({ key, late: info.isLate, early: info.isEarlyLeave, hours: info.hours });
    }
    return out.sort((a, b) => b.key.localeCompare(a.key));
  }, [calendar.data]);

  const kpiRows = k
    ? [
        { key: "progress", label: "Tiến độ", value: r1(k.progress.kpi) },
        { key: "quality", label: "Chất lượng", value: r1(k.quality.kpi) },
        { key: "punctuality", label: "Đúng giờ", value: r1(k.punctuality.kpi) },
        { key: "attitude", label: "Thái độ", value: r1(k.attitude.kpi) },
        { key: "initiative", label: "Sáng kiến", value: r1(k.initiative.kpi) },
        { key: "customer", label: "Khách hàng", value: r1(k.customer.kpi) },
      ]
    : [];

  return (
    <>
      <TopBar>
        <Breadcrumb items={[{ label: "Phân tích", href: "/analytics?tab=members" }, { label: name }]} />
        <TopBarSpacer />
        <Select small aria-label="Tháng" className="w-40" value={month} onChange={(e) => setMonth(e.target.value)}>
          {months().map((m) => <option key={m} value={m}>Tháng {m.slice(5)}/{m.slice(0, 4)}</option>)}
        </Select>
      </TopBar>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-5 p-5 max-sm:p-3">
          {/* Đầu trang: nhân viên + tổng KPI */}
          <div className="flex items-center gap-3 rounded-lg border border-line bg-surface p-4">
            <Avatar person={{ id: memberId, name, avatar }} size="lg" />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[16px] font-semibold">{name}</h1>
              <p className="text-[12.5px] text-ink-muted">Chi tiết công việc tháng {month.slice(5)}/{month.slice(0, 4)}</p>
            </div>
            {k && <div className="text-right"><div className="font-mono text-[22px] font-bold text-ink">{r1(k.totalKpi)}%</div><div className="text-[11.5px] text-ink-faint">Tổng KPI</div></div>}
          </div>

          {/* Biểu đồ */}
          <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-1">
            <Card title="KPI theo thành phần">
              {kpiList.isLoading ? <Skeleton className="h-36" /> : kpiRows.length ? <BarList label="KPI theo thành phần" rows={kpiRows} unit="%" /> : <EmptyState title="Chưa có KPI" className="py-8" />}
            </Card>
            <Card title="Phân bố trạng thái task">
              {totals ? <StackedBar label="Phân bố trạng thái" segments={statusSegments(totals)} height={12} /> : <EmptyState title="Chưa có task" className="py-8" />}
            </Card>
            <Card title="Phân bố độ ưu tiên">
              {totals ? <StackedBar label="Phân bố độ ưu tiên" segments={prioritySegments(totals)} height={12} /> : <EmptyState title="Chưa có task" className="py-8" />}
            </Card>
          </div>
          <Card title="Xu hướng KPI 6 tháng">
            <LineChart
              title="Xu hướng KPI"
              unit="%"
              labels={trendMonths.map((m) => m.slice(5))}
              series={[{ key: "kpi", label: "Tổng KPI", color: "var(--chart-1)", points: trend.map((q) => r1(q.data?.find((x) => x.memberId === memberId)?.totalKpi ?? 0)) }]}
            />
          </Card>

          {/* Danh sách lỗi/đóng góp trong tháng */}
          <div className="grid grid-cols-2 gap-5 max-lg:grid-cols-1">
            <TaskListCard title="Task bug (chịu lỗi)" tone="danger" tasks={breakdown.data?.bugTasks} loading={breakdown.isLoading} empty="Không có task bug nào." />
            <TaskListCard title="Task đang quá hạn (chưa xong)" tone="danger" tasks={breakdown.data?.overdueTasks} loading={breakdown.isLoading} empty="Không có task nào đang quá hạn." showDue />
            <TaskListCard title="Task hoàn thành trễ" tone="warning" tasks={breakdown.data?.completedLateTasks} loading={breakdown.isLoading} empty="Không có task nào hoàn thành trễ." showDue />
            <TaskListCard title="Task bị trả lại (rework)" tone="warning" tasks={breakdown.data?.reworkTasks} loading={breakdown.isLoading} empty="Không có task nào bị trả lại." showReturn />
          </div>

          {/* Chấm công + sáng kiến + phản hồi */}
          <div className="grid grid-cols-2 gap-5 max-lg:grid-cols-1">
            <Card title={`Đi muộn / về sớm (${attnDays.length} ngày)`}>
              {calendar.isLoading ? <Skeleton className="h-16" /> : attnDays.length === 0 ? <EmptyState title="Không có ngày đi muộn/về sớm." className="py-6" /> : (
                <ul className="flex flex-col gap-1.5 text-[13px]">
                  {attnDays.map((d) => (
                    <li key={d.key} className="flex items-center gap-2">
                      <span className="font-mono text-[12px] text-ink-2">{fmtDate(d.key)}</span>
                      {d.late && <Badge tone="warning">Đi muộn</Badge>}
                      {d.early && <Badge tone="warning">Về sớm</Badge>}
                      <span className="ml-auto font-mono text-[11.5px] text-ink-faint">{r1(d.hours)}h</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card title={`Log đi muộn thủ công (${rec?.lateLogs?.length ?? 0})`}>
              {records.isLoading ? <Skeleton className="h-16" /> : !(rec?.lateLogs?.length) ? <EmptyState title="Không có log đi muộn." className="py-6" /> : (
                <ul className="flex flex-col gap-1.5 text-[13px]">
                  {rec!.lateLogs.map((l) => (
                    <li key={l.id} className="flex items-center gap-2">
                      <span className="font-mono text-[12px] text-ink-2">{fmtDate(l.lateTime)}</span>
                      <span className="truncate text-ink-muted">{l.content || "—"}</span>
                      <span className="ml-auto font-mono text-[11.5px] text-danger">−{r1(l.estimate)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card title={`Sáng kiến (${rec?.initiatives?.length ?? 0})`}>
              {records.isLoading ? <Skeleton className="h-16" /> : !(rec?.initiatives?.length) ? <EmptyState title="Không có sáng kiến." className="py-6" /> : (
                <ul className="flex flex-col gap-1.5 text-[13px]">
                  {rec!.initiatives.map((it) => (
                    <li key={it.id} className="flex items-center gap-2">
                      <span className="truncate font-medium">{it.content}</span>
                      <span className="ml-auto shrink-0 font-mono text-[11.5px] text-success">+{r1(it.estimate)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card title={`Phản hồi khách hàng (${rec?.feedbacks?.length ?? 0})`}>
              {records.isLoading ? <Skeleton className="h-16" /> : !(rec?.feedbacks?.length) ? <EmptyState title="Không có phản hồi." className="py-6" /> : (
                <ul className="flex flex-col gap-1.5 text-[13px]">
                  {rec!.feedbacks.map((f) => (
                    <li key={f.id} className="flex items-center gap-2">
                      <span className="truncate">{f.content}</span>
                      <span className="ml-auto shrink-0 font-mono text-[11.5px] text-success">+{r1(f.estimate)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-lg border border-line bg-surface p-4"><h2 className="mb-3 text-[13px] font-semibold">{title}</h2>{children}</section>
);

function TaskListCard({ title, tone, tasks, loading, empty, showDue, showReturn }: { title: string; tone: "danger" | "warning"; tasks?: MemberTaskBrief[]; loading: boolean; empty: string; showDue?: boolean; showReturn?: boolean }) {
  return (
    <section className="rounded-lg border border-line bg-surface p-4">
      <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold">
        {title}
        <Badge tone={tone}>{tasks?.length ?? 0}</Badge>
      </h2>
      {loading ? (
        <Skeleton className="h-16" />
      ) : !tasks?.length ? (
        <EmptyState title={empty} className="py-6" />
      ) : (
        <ul className="flex flex-col divide-y divide-line-row">
          {tasks.map((t) => {
            const lvl = priorityLevel(t.priority);
            return (
              <li key={t.id} className="py-1.5">
                <Link href={`/projects/${t.projectId}/tasks?task=${t.id}`} className="flex items-center gap-2 text-[13px] hover:text-accent-ink">
                  <span className="font-mono text-[11.5px] text-ink-faint">{t.code}</span>
                  <StatusChip status={t.status as TaskStatus} size="sm" />
                  {lvl !== null && <span className="font-mono text-[11px]" style={{ color: PRIORITY_META[lvl].color }}>{PRIORITY_META[lvl].tag}</span>}
                  <span className="min-w-0 flex-1 truncate">{t.title}</span>
                  {showReturn && <span className="shrink-0 font-mono text-[11.5px] text-danger">×{t.returnCount}</span>}
                  {showDue && t.endDate && <span className="shrink-0 font-mono text-[11.5px] text-ink-faint">{fmtDayMonth(t.endDate)}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
