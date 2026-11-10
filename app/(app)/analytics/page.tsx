"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQueries } from "@tanstack/react-query";
import { getWorkspaceAttendanceStatistics, getWorkspaceKpi, getWorkspaceTaskStatistics } from "@/lib/api/endpoints";
import type { KPIMemberResponse, KPISettingsResponse } from "@/lib/api/schema";
import { qk } from "@/lib/query/keys";
import { monthKey, projectColor } from "@/lib/domain/format";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { useUrlState } from "@/lib/hooks/useUrlState";
import { useKpi, useKpiSettings, useMyKpi, usePerformanceMutations } from "@/lib/hooks/performance";
import { useMyTaskStats, useTaskStats } from "@/lib/hooks/stats";
import { useAttendanceStats } from "@/lib/hooks/attendance";
import { useToast } from "@/lib/toast/ToastProvider";
import { exportGroupKpiExcel, exportOneKpiExcel } from "@/lib/kpi/exportKpiExcel";
import { TopBar, TopBarSpacer } from "@/components/shell/TopBar";
import { Breadcrumb } from "@/components/shell/Breadcrumb";
import { Tabs } from "@/components/ui/Tabs";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/Modal";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/feedback";
import { MetricStrip } from "@/components/kairso/MetricStrip";
import { BarList } from "@/components/charts/BarList";
import { LineChart } from "@/components/charts/LineChart";
import { StackedBar } from "@/components/charts/StackedBar";
import { statusSegments } from "@/components/charts/statusSegments";
import { prioritySegments } from "@/components/charts/prioritySegments";
import { histogram, workloadBalance } from "@/lib/domain/analytics";
import { IconChart, IconDownload } from "@/components/icons";

const months = () => Array.from({ length: 12 }, (_, i) => monthKey(new Date(new Date().getFullYear(), new Date().getMonth() - i, 1)));
const r1 = (n: number) => Math.round(n * 10) / 10;

export default function AnalyticsPage() {
  const { isManager } = useWorkspace();
  const [tab, setTab] = useUrlState("tab", isManager ? "workspace" : "mine");
  const [month, setMonth] = useUrlState("month", monthKey(new Date()));
  const t = isManager ? (["workspace", "members", "projects"].includes(tab) ? tab : "workspace") : "mine";
  return (
    <>
      <TopBar><Breadcrumb items={[{ label: "Phân tích" }]} /><TopBarSpacer />
        <Select small aria-label="Tháng" className="w-40" value={month} onChange={(e) => setMonth(e.target.value)}>{months().map((m) => <option key={m} value={m}>Tháng {m.slice(5)}/{m.slice(0, 4)}</option>)}</Select>
      </TopBar>
      <Tabs label="Phân tích" value={t} onChange={setTab} className="bg-surface px-3" tabs={isManager ? [{ value: "workspace", label: "Workspace" }, { value: "members", label: "Thành viên" }, { value: "projects", label: "Dự án" }] : [{ value: "mine", label: "Của tôi" }]} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-5 p-5 max-sm:p-3">
          {t === "mine" && <Mine month={month} />}
          {t === "workspace" && <WorkspaceTab month={month} />}
          {t === "members" && <MembersTab month={month} />}
          {t === "projects" && <ProjectsTab month={month} />}
        </div>
      </div>
    </>
  );
}

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-lg border border-line bg-surface p-4"><h2 className="mb-3 text-[13px] font-semibold">{title}</h2>{children}</section>
);

function KpiBreakdown({ k }: { k: KPIMemberResponse }) {
  return (
    <MetricStrip metrics={[
      { label: "Tổng KPI", value: `${r1(k.totalKpi)}%` },
      { label: "Tiến độ", value: r1(k.progress.kpi), hint: `trễ ${Math.round(k.progress.lateRatio * 100)}%` },
      { label: "Chất lượng", value: r1(k.quality.kpi), hint: `sạch ${Math.round(k.quality.ratio * 100)}%` },
      { label: "Đúng giờ", value: r1(k.punctuality.kpi), hint: `−${r1(k.punctuality.deduction)}` },
      { label: "Thái độ", value: r1(k.attitude.kpi) },
      { label: "Sáng kiến", value: r1(k.initiative.kpi) },
      { label: "Khách hàng", value: r1(k.customer.kpi) },
    ]} />
  );
}

function Mine({ month }: { month: string }) {
  const { workspaceId } = useWorkspace();
  const kpi = useMyKpi(workspaceId, month);
  const stats = useMyTaskStats(workspaceId, { month });
  return (
    <>
      {kpi.isLoading ? <Skeleton className="h-[58px]" /> : kpi.isError ? <ErrorState error={kpi.error} onRetry={() => kpi.refetch()} /> : kpi.data && <KpiBreakdown k={kpi.data} />}
      {kpi.data && (
        <div><Link href={`/analytics/members/${kpi.data.memberId}?month=${month}`} className="text-[12.5px] font-medium text-accent-ink hover:underline">Xem chi tiết công việc tháng (task bug / trễ / rework / đi muộn…) →</Link></div>
      )}
      {stats.data && (
        <div className="grid grid-cols-2 gap-5 max-lg:grid-cols-1">
          <Card title="Task của tôi theo trạng thái"><StackedBar label="Task của tôi" segments={statusSegments(stats.data)} height={12} /></Card>
          <Card title="Task của tôi theo độ ưu tiên"><StackedBar label="Task của tôi theo độ ưu tiên" segments={prioritySegments(stats.data)} height={12} /></Card>
        </div>
      )}
    </>
  );
}

function WorkspaceTab({ month }: { month: string }) {
  const { workspaceId } = useWorkspace();
  const kpi = useKpi(workspaceId, month);
  const stats = useTaskStats(workspaceId, { month });
  const att = useAttendanceStats(workspaceId, month);
  const list = [...(kpi.data ?? [])].sort((a, b) => b.totalKpi - a.totalKpi);
  const t = stats.data?.totals;
  const a = att.data?.totals;
  const kpiRows = list.map((k) => ({ key: k.memberId, label: k.memberName, value: r1(k.totalKpi) }));
  const kpiBalance = kpiRows.length > 1 ? workloadBalance(kpiRows) : null;
  return (
    <>
      <MetricStrip metrics={[
        { label: "Tổng task", value: t?.totalTasks ?? "—" },
        { label: "Hoàn thành", value: t?.done ?? "—" },
        { label: "Quá hạn", value: t?.totalOverdue ?? "—", tone: (t?.totalOverdue ?? 0) > 0 ? "danger" : "default" },
        { label: "Cycle time TB", value: t && t.cycleTimeSampleSize > 0 ? r1(t.avgCycleDays) : "—", hint: t && t.cycleTimeSampleSize > 0 ? "ngày" : undefined },
        { label: "Giờ làm", value: a ? r1(a.attendanceHours) : "—", hint: "h" },
        { label: "Ngày đi muộn", value: a?.lateDays ?? "—" },
      ]} />
      <div className="grid grid-cols-2 gap-5 max-lg:grid-cols-1">
        {t && <Card title="Phân bố trạng thái task"><StackedBar label="Phân bố trạng thái" segments={statusSegments(t)} height={12} /></Card>}
        {t && <Card title="Phân bố độ ưu tiên"><StackedBar label="Phân bố độ ưu tiên" segments={prioritySegments(t)} height={12} /></Card>}
      </div>
      <Card title="Xu hướng 6 tháng gần đây">
        <WorkspaceTrend />
      </Card>
      <div className="grid grid-cols-2 gap-5 max-lg:grid-cols-1">
        <Card title="KPI theo thành viên">
          {kpi.isLoading ? <Skeleton className="h-40" /> : kpi.isError ? <ErrorState error={kpi.error} onRetry={() => kpi.refetch()} /> : list.length === 0 ? <EmptyState icon={<IconChart size={26} />} title="Chưa có dữ liệu KPI" className="py-8" /> : (
            <div className="flex flex-col gap-3">
              <BarList label="KPI tổng theo thành viên" unit="%" rows={kpiRows} />
              {kpiBalance && (
                <p className="border-t border-line pt-2 text-[12px] text-ink-muted">
                  Trung bình <b className="font-mono text-ink">{r1(kpiBalance.mean)}%</b> · độ lệch chuẩn <b className="font-mono text-ink">{r1(kpiBalance.stdDev)}</b> · CV <b className="font-mono text-ink">{Math.round(kpiBalance.cv * 100)}%</b>
                  {" "}({kpiBalance.cv < 0.1 ? "hiệu suất khá đồng đều giữa các thành viên" : kpiBalance.cv < 0.25 ? "chênh lệch vừa phải" : "chênh lệch lớn giữa các thành viên"}).
                </p>
              )}
            </div>
          )}
        </Card>
        <Card title="Phân bố điểm KPI">
          {list.length === 0 ? <EmptyState icon={<IconChart size={26} />} title="Chưa có dữ liệu KPI" className="py-8" /> : (
            <KpiHistogram values={list.map((k) => k.totalKpi)} />
          )}
        </Card>
      </div>
    </>
  );
}

const KPI_BUCKET_EDGES = [0, 60, 70, 80, 90, 100, 1000];
const KPI_BUCKET_LABELS = ["<60", "60–70", "70–80", "80–90", "90–100", "100+"];

function KpiHistogram({ values }: { values: number[] }) {
  const counts = histogram(values, KPI_BUCKET_EDGES);
  return (
    <BarList
      label="Phân bố điểm KPI"
      color="var(--chart-1)"
      rows={KPI_BUCKET_LABELS.map((label, i) => ({ key: label, label, value: counts[i] }))}
    />
  );
}

function WorkspaceTrend() {
  const { workspaceId } = useWorkspace();
  const ms = useMemo(() => Array.from({ length: 6 }, (_, i) => monthKey(new Date(new Date().getFullYear(), new Date().getMonth() - (5 - i), 1))), []);
  const taskRes = useQueries({ queries: ms.map((m) => ({ queryKey: qk.stats(workspaceId, "ws-trend", { m }), queryFn: () => getWorkspaceTaskStatistics(workspaceId, { month: m }) })) });
  const attRes = useQueries({ queries: ms.map((m) => ({ queryKey: qk.attStats(workspaceId, { m, trend: true }), queryFn: () => getWorkspaceAttendanceStatistics(workspaceId, { month: m }) })) });
  if (taskRes.some((r) => r.isLoading) || attRes.some((r) => r.isLoading)) return <Skeleton className="h-40" />;
  const labels = ms.map((m) => `T${m.slice(5)}`);
  return (
    <div className="grid grid-cols-2 gap-5 max-lg:grid-cols-1">
      <LineChart
        title="Task theo tháng"
        labels={labels}
        series={[
          { key: "total", label: "Tổng task", color: "var(--chart-1)", points: taskRes.map((r) => r.data?.totals?.totalTasks ?? 0) },
          { key: "done", label: "Hoàn thành", color: "var(--chart-2)", points: taskRes.map((r) => r.data?.totals?.done ?? 0) },
        ]}
      />
      <LineChart
        title="Giờ làm theo tháng"
        unit="h"
        labels={labels}
        series={[{ key: "hours", label: "Giờ làm", color: "var(--chart-1)", points: attRes.map((r) => r1(r.data?.totals?.attendanceHours ?? 0)) }]}
      />
    </div>
  );
}

function maxima(s: KPISettingsResponse | undefined) {
  return {
    progress: s?.progressWeight ?? 35,
    quality: s?.qualityWeight ?? 30,
    punctuality: s?.punctualityWeight ?? 15,
    attitude: s?.attitudeWeight ?? 5,
    initiative: s?.initiativeWeight ?? 5,
    customer: s?.customerWeight ?? 10,
  };
}

function totalTone(v: number): "success" | "warning" | "danger" {
  if (v >= 86) return "success";
  if (v >= 70) return "warning";
  return "danger";
}
const TOTAL_TONE_CLASS: Record<ReturnType<typeof totalTone>, string> = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

function MembersTab({ month }: { month: string }) {
  const { workspaceId, members } = useWorkspace();
  const toast = useToast();
  const kpi = useKpi(workspaceId, month);
  const settings = useKpiSettings(workspaceId, true);
  const { setAttitude } = usePerformanceMutations(workspaceId);
  const [sel, setSel] = useState<KPIMemberResponse | null>(null);
  const [exporting, setExporting] = useState(false);
  const list = [...(kpi.data ?? [])].sort((a, b) => b.totalKpi - a.totalKpi);
  const m = maxima(settings.data);
  const holderName = members.find((mm) => mm.role === "holder")?.userName ?? "";
  const monthLabel = `${month.slice(5)}/${month.slice(0, 4)}`;

  const exportGroup = async () => {
    if (!settings.data || list.length === 0) return;
    setExporting(true);
    try {
      await exportGroupKpiExcel(workspaceId, month);
    } catch (e) {
      toast.error(e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-[12.5px] text-ink-muted">{list.length} thành viên · KPI tháng {monthLabel}</p>
        <Button size="sm" loading={exporting} disabled={list.length === 0 || !settings.data} onClick={exportGroup}>
          <IconDownload size={13} /> Xuất Excel cả nhóm
        </Button>
      </div>
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <table className="w-full text-[13px]">
          <thead className="text-left text-[11px] font-medium uppercase tracking-wide text-ink-faint">
            <tr className="h-thead border-b border-line">
              <th className="w-9 px-2 text-center">#</th>
              <th className="px-2">Thành viên</th>
              <th className="px-2 text-right">Tiến độ</th>
              <th className="px-2 text-right">Chất lượng</th>
              <th className="px-2 text-right">Đúng giờ</th>
              <th className="px-2 text-right">Thái độ</th>
              <th className="px-2 text-right">Sáng kiến</th>
              <th className="px-2 text-right">Khách hàng</th>
              <th className="px-3 text-right">Tổng KPI</th>
              <th className="w-16" />
            </tr>
          </thead>
          <tbody>
            {kpi.isLoading && <tr><td colSpan={10} className="p-4"><Skeleton className="h-24" /></td></tr>}
            {!kpi.isLoading && list.length === 0 && (
              <tr><td colSpan={10}><EmptyState icon={<IconChart size={26} />} title="Chưa có dữ liệu KPI trong kỳ" className="py-10" /></td></tr>
            )}
            {list.map((k, i) => (
              <tr key={k.memberId} className="h-14 border-b border-line-row last:border-b-0 hover:bg-row-hover">
                <td className="px-2 text-center font-mono text-[11.5px] text-ink-faint">{i + 1}</td>
                <td className="px-2">
                  <Link href={`/analytics/members/${k.memberId}?month=${month}`} className="flex items-center gap-2 hover:text-accent-ink">
                    <Avatar person={{ id: k.memberId, name: k.memberName, avatar: k.memberAvatar }} /><span className="truncate font-medium text-ink">{k.memberName}</span>
                  </Link>
                </td>
                <td className="px-2 text-right font-mono text-ink-2">{r1(k.progress.kpi)}<span className="text-ink-faint">/{r1(m.progress)}</span></td>
                <td className="px-2 text-right font-mono text-ink-2">{r1(k.quality.kpi)}<span className="text-ink-faint">/{r1(m.quality)}</span></td>
                <td className="px-2 text-right font-mono text-ink-2">{r1(k.punctuality.kpi)}<span className="text-ink-faint">/{r1(m.punctuality)}</span></td>
                <td className="px-2 text-right font-mono text-ink-2">{r1(k.attitude.kpi)}<span className="text-ink-faint">/{r1(m.attitude)}</span></td>
                <td className="px-2 text-right font-mono text-ink-2">{r1(k.initiative.kpi)}<span className="text-ink-faint">/{r1(m.initiative)}</span></td>
                <td className="px-2 text-right font-mono text-ink-2">{r1(k.customer.kpi)}<span className="text-ink-faint">/{r1(m.customer)}</span></td>
                <td className={`px-3 text-right font-mono text-[14px] font-bold ${TOTAL_TONE_CLASS[totalTone(k.totalKpi)]}`}>{r1(k.totalKpi)}%</td>
                <td className="px-2 text-right"><Button size="sm" variant="ghost" onClick={() => setSel(k)}>Phiếu KPI</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={!!sel} onClose={() => setSel(null)} title={sel ? `Phiếu KPI — ${sel.memberName}` : ""} width={960}>
        {sel && settings.data && (
          <KpiSlip
            k={sel}
            settings={settings.data}
            month={month}
            monthLabel={monthLabel}
            controllerName={holderName}
            memberDisplayName={members.find((mm) => mm.userId === sel.memberId)?.userName ?? sel.memberName}
            onSaveAttitude={(v) => setAttitude.mutate({ memberId: sel.memberId, month, ...v }, { onSuccess: () => toast.success("Đã lưu điểm thái độ"), onError: (e) => toast.error(e) })}
            attitudeBusy={setAttitude.isPending}
          />
        )}
      </Modal>
    </>
  );
}

const SLIP_ROW = "grid grid-cols-[48px_minmax(0,1.25fr)_minmax(0,1.5fr)_88px_88px_120px] items-stretch text-[12.5px]";

function KpiSlip({
  k, settings, month, monthLabel, controllerName, memberDisplayName, onSaveAttitude, attitudeBusy,
}: {
  k: KPIMemberResponse;
  settings: KPISettingsResponse;
  month: string;
  monthLabel: string;
  controllerName: string;
  memberDisplayName: string;
  onSaveAttitude: (v: { score: number; comment: string }) => void;
  attitudeBusy: boolean;
}) {
  const { workspaceId } = useWorkspace();
  const [exporting, setExporting] = useState(false);
  const toast = useToast();

  const rows: Array<{ stt: string | number; label: string; how?: string; weight: number; result: number; note?: string; section?: boolean }> = [
    { stt: "A", label: "ĐÁNH GIÁ TỪ KHÁCH HÀNG", weight: settings.customerWeight, result: k.customer.kpi, section: true },
    { stt: 1, label: "Khách hàng có phản hồi tích cực", how: "Từ cấp trưởng phòng, trong biên bản nghiệm thu", weight: r1(settings.customerWeight * 0.7), result: r1(k.customer.kpi) },
    { stt: 2, label: "Không phản hồi", weight: r1(settings.customerWeight * 0.3), result: 0 },
    { stt: 3, label: "Claim", weight: 0, result: 0 },
    { stt: "B", label: "CÔNG VIỆC", weight: settings.progressWeight + settings.qualityWeight + settings.initiativeWeight, result: k.progress.kpi + k.quality.kpi + k.initiative.kpi, section: true },
    { stt: 1, label: "Tiến độ (Đúng hạn)", how: "Đo lường mức độ hoàn thành theo khối lượng công việc", weight: settings.progressWeight, result: r1(k.progress.kpi), note: `Trễ ${Math.round(k.progress.lateRatio * 100)}%` },
    { stt: 2, label: "Chất lượng (Rework)", how: "Đo lường khối lượng bị QA/Tester trả về", weight: settings.qualityWeight, result: r1(k.quality.kpi), note: `Sạch ${Math.round(k.quality.ratio * 100)}%` },
    { stt: 3, label: "Sáng kiến / Giải pháp", how: "Đếm giải pháp tối ưu/tái cấu trúc được áp dụng", weight: settings.initiativeWeight, result: r1(k.initiative.kpi) },
    { stt: "C", label: "KỶ LUẬT LAO ĐỘNG", weight: settings.punctualityWeight + settings.attitudeWeight, result: k.punctuality.kpi + k.attitude.kpi, section: true },
    { stt: 1, label: "Đi sớm về muộn", how: "Theo bảng theo dõi hằng ngày", weight: settings.punctualityWeight, result: r1(k.punctuality.kpi), note: `−${r1(k.punctuality.deduction)}` },
    { stt: 2, label: "Thái độ công việc, cố gắng", how: "Theo đánh giá của trưởng bộ phận", weight: settings.attitudeWeight, result: r1(k.attitude.kpi) },
  ];

  const doExport = async () => {
    setExporting(true);
    try {
      await exportOneKpiExcel(workspaceId, month, k.memberId, k.memberAlias);
    } catch (e) {
      toast.error(e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-line-strong bg-surface">
        <div className="border-b border-line-strong px-5 py-3 text-center">
          <h3 className="text-[15px] font-bold tracking-wide">BẢNG ĐÁNH GIÁ HIỆU QUẢ CÔNG VIỆC HÀNG THÁNG (KPI)</h3>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 border-b border-line-strong px-5 py-3 text-[13px] max-sm:grid-cols-1">
          <p><span className="text-ink-muted">KPI Tháng:</span> <b className="font-mono">{monthLabel}</b></p>
          <p><span className="text-ink-muted">Người duyệt:</span> <span className="text-ink-faint">(để trống, ký tay)</span></p>
          <p><span className="text-ink-muted">Người thực hiện:</span> <b>{memberDisplayName}</b></p>
          <p><span className="text-ink-muted">Người kiểm soát:</span> <b>{controllerName || "—"}</b></p>
        </div>
        <p className="border-b border-line-strong bg-hover px-5 py-2 text-[12px] text-ink-muted">
          <b className="text-ink">Kết quả đánh giá:</b> 85 điểm coi như hoàn thành công việc — từ 86 điểm trở lên coi như vượt chỉ tiêu.
        </p>

        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            <div className={`${SLIP_ROW} border-b border-line-strong bg-hover text-[11px] font-semibold uppercase tracking-wide text-ink-faint`}>
              <span className="flex items-center justify-center px-1 py-2">STT</span>
              <span className="flex items-center px-3 py-2">Tiêu chí đánh giá</span>
              <span className="flex items-center px-3 py-2">Cách thực hiện</span>
              <span className="flex items-center justify-center px-1 py-2 text-center leading-tight">Hệ số<br />(%)</span>
              <span className="flex items-center justify-center px-1 py-2 text-center leading-tight">Kết quả<br />(%)</span>
              <span className="flex items-center px-3 py-2">Ghi chú</span>
            </div>
            {rows.map((row, i) => (
              <div key={i} className={`${SLIP_ROW} border-b border-line-row ${row.section ? "bg-hover font-semibold" : ""}`}>
                <span className="flex items-center justify-center px-1 py-2 font-mono">{row.stt}</span>
                <span className={`flex items-center px-3 py-2 ${row.section ? "" : "pl-5 text-ink-2"}`}>{row.label}</span>
                <span className="flex items-center px-3 py-2 text-[11.5px] leading-snug text-ink-faint">{row.how}</span>
                <span className="flex items-center justify-center px-1 py-2 font-mono tabular-nums">{r1(row.weight)}%</span>
                <span className="flex items-center justify-center px-1 py-2 font-mono tabular-nums">{r1(row.result)}%</span>
                <span className="flex items-center px-3 py-2 text-[11.5px] text-ink-faint">{row.note}</span>
              </div>
            ))}
            <div className={`${SLIP_ROW} bg-accent-soft text-[13px] font-bold`}>
              <span />
              <span className="flex items-center px-3 py-2.5 text-accent-ink">TỔNG KPI</span>
              <span />
              <span className="flex items-center justify-center px-1 py-2.5 font-mono tabular-nums text-accent-ink">100%</span>
              <span className={`flex items-center justify-center px-1 py-2.5 font-mono text-[14px] tabular-nums ${TOTAL_TONE_CLASS[totalTone(k.totalKpi)]}`}>{r1(k.totalKpi)}%</span>
              <span />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
          <p className="text-[12px] text-ink-faint">Người thực hiện · Người kiểm soát · Người phê duyệt</p>
          <Button size="sm" variant="primary" loading={exporting} onClick={doExport}>
            <IconDownload size={13} /> Xuất Excel
          </Button>
        </div>
      </div>

      <AttitudeForm memberId={k.memberId} initial={{ score: k.attitude.score, comment: k.attitude.comment ?? "" }} busy={attitudeBusy} onSave={onSaveAttitude} />
      <Trend memberId={k.memberId} name={memberDisplayName} />
    </div>
  );
}

function AttitudeForm({ initial, busy, onSave }: { memberId: string; initial: { score: number; comment: string }; busy: boolean; onSave: (v: { score: number; comment: string }) => void }) {
  const [score, setScore] = useState(String(initial.score));
  const [comment, setComment] = useState(initial.comment);
  const dirty = Number(score) !== initial.score || comment.trim() !== (initial.comment ?? "");
  return (
    <form onSubmit={(e) => (e.preventDefault(), onSave({ score: Number(score), comment: comment.trim() }))} className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-3.5">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-faint">Điểm thái độ (do quản lý chấm)</p>
      <div className="flex gap-3 max-sm:flex-col">
        <Field label="Điểm" className="w-24 shrink-0">{(p) => <Input {...p} type="number" min={0} max={100} step="0.5" className="font-mono" value={score} onChange={(e) => setScore(e.target.value)} />}</Field>
        <Field label="Nhận xét" className="flex-1">{(p) => <Textarea {...p} rows={2} placeholder="Nhận xét về thái độ làm việc trong tháng…" value={comment} onChange={(e) => setComment(e.target.value)} />}</Field>
      </div>
      <div className="flex justify-end">
        <Button type="submit" variant="primary" loading={busy} disabled={!dirty || score === "" || Number(score) < 0}>Lưu điểm thái độ</Button>
      </div>
    </form>
  );
}

function Trend({ memberId, name }: { memberId: string; name: string }) {
  const { workspaceId } = useWorkspace();
  const ms = useMemo(() => Array.from({ length: 6 }, (_, i) => monthKey(new Date(new Date().getFullYear(), new Date().getMonth() - (5 - i), 1))), []);
  const res = useQueries({ queries: ms.map((m) => ({ queryKey: qk.kpi(workspaceId, "trend", { m, memberId }), queryFn: () => getWorkspaceKpi(workspaceId, { month: m, memberId }) })) });
  if (res.some((r) => r.isLoading)) return <Skeleton className="h-40" />;
  return <LineChart title={`KPI 6 tháng của ${name}`} unit="%" labels={ms.map((m) => `T${m.slice(5)}`)} series={[{ key: "kpi", label: "KPI tổng (%)", color: "var(--chart-1)", points: res.map((r) => r.data?.[0]?.totalKpi ?? 0) }]} />;
}

function ProjectsTab({ month }: { month: string }) {
  const { workspaceId, projects } = useWorkspace();
  const res = useQueries({ queries: projects.map((p) => ({ queryKey: qk.stats(workspaceId, "project", { p: p.id, month }), queryFn: () => getWorkspaceTaskStatistics(workspaceId, { projectId: p.id, month }) })) });
  return (
    <>
      {projects.length === 0 && <EmptyState title="Chưa có dự án" className="py-10" />}
      {projects.map((p, i) => {
        const t = res[i]?.data?.totals;
        return (
          <Card key={p.id} title={p.name}>
            {res[i]?.isLoading ? <Skeleton className="h-10" /> : !t || t.totalTasks === 0 ? <p className="text-[13px] text-ink-muted">Chưa có task trong kỳ.</p> : (
              <div className="flex flex-col gap-3">
                <p className="flex flex-wrap gap-x-6 text-[12.5px] text-ink-muted"><span><span className="mr-1.5 inline-block size-2 rounded-[2px]" style={{ background: projectColor(p.id) }} />Tổng <b className="font-mono text-ink">{t.totalTasks}</b></span><span>Quá hạn <b className={`font-mono ${t.totalOverdue ? "text-danger" : "text-ink"}`}>{t.totalOverdue}</b></span><span>Giờ ước tính <b className="font-mono text-ink">{r1(t.totalEstimation)}h</b></span></p>
                <StackedBar label={`Trạng thái ${p.name}`} segments={statusSegments(t)} height={10} />
              </div>
            )}
          </Card>
        );
      })}
    </>
  );
}
