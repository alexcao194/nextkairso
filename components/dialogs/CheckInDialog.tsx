"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { useToast } from "@/lib/toast/ToastProvider";
import { dateOnly, useAttendanceMutations, useAttendanceSettings, useMyDailyReports } from "@/lib/hooks/attendance";
import { fmtTime } from "@/lib/domain/format";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/form";
import { Alert, Skeleton } from "@/components/ui/feedback";
import { IconClock } from "@/components/icons";
import type { AttendanceStatusResponse } from "@/lib/api/schema";

export function CheckInDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Chấm công" width={440}>
      <Body onClose={onClose} />
    </Modal>
  );
}

function Body({ onClose }: { onClose: () => void }) {
  const { workspaceId } = useWorkspace();
  const toast = useToast();
  const settings = useAttendanceSettings(workspaceId);
  const m = useAttendanceMutations(workspaceId);
  const [status, setStatus] = useState<AttendanceStatusResponse | null>(null);
  const [now, setNow] = useState(new Date());

  const today = dateOnly(new Date());
  const reports = useMyDailyReports(workspaceId, today, today);
  const existing = reports.data?.[0];
  const [report, setReport] = useState({ done: "", inProgress: "", issues: "" });
  useEffect(() => {
    if (existing) setReport({ done: existing.done ?? "", inProgress: existing.inProgress ?? "", issues: existing.issues ?? "" });
  }, [existing]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const wifiRequired = !!settings.data?.validationEnabled;

  useEffect(() => {
    if (!workspaceId || wifiRequired || settings.isLoading) return;
    let alive = true;
    m.status
      .mutateAsync({ latitude: 0, longitude: 0, wifiBSSID: "" })
      .then((s) => alive && setStatus(s))
      .catch((e) => toast.error(e));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, wifiRequired, settings.isLoading]);

  const doCheckout = () => {
    const body = { latitude: 0, longitude: 0, wifiBSSID: "", recordedAt: new Date().toISOString() };
    m.checkOut.mutate(body, {
      onSuccess: (r) => {
        toast.success(`Check-out lúc ${fmtTime(r.recordedAt)}`);
        onClose();
      },
      onError: (e) => toast.error(e),
    });
  };

  const act = () => {
    if (!status) return;
    if (status.nextAction === "check_in") {
      const body = { latitude: 0, longitude: 0, wifiBSSID: "", recordedAt: new Date().toISOString() };
      m.checkIn.mutate(body, {
        onSuccess: (r) => {
          toast.success(`Check-in lúc ${fmtTime(r.recordedAt)}`);
          onClose();
        },
        onError: (e) => toast.error(e),
      });
      return;
    }
    m.saveMyDailyReport.mutate(
      { date: today, done: report.done.trim(), inProgress: report.inProgress.trim(), issues: report.issues.trim() },
      { onSuccess: doCheckout, onError: (e) => toast.error(e) },
    );
  };

  const isIn = status?.nextAction === "check_in";
  const reportValid = !!(report.done.trim() || report.inProgress.trim());
  const busy = m.checkIn.isPending || m.checkOut.isPending || m.saveMyDailyReport.isPending;

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="font-mono text-[34px] font-semibold tracking-tight">{now.toLocaleTimeString("vi-VN", { hour12: false })}</p>
      {settings.isLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : wifiRequired ? (
        <Alert tone="warning" className="w-full">
          Workspace yêu cầu xác thực Wi-Fi công ty, mà trình duyệt web không đọc được Wi-Fi. Hãy chấm công trên ứng dụng di động, hoặc{" "}
          <Link href="/calendar?tab=requests" onClick={onClose} className="font-medium underline">gửi yêu cầu bổ sung công</Link>.
        </Alert>
      ) : !status ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <>
          {!status.isConfigured && <Alert tone="info" className="w-full">Workspace chưa cấu hình chấm công; bản ghi vẫn được lưu.</Alert>}
          {!isIn && (
            <div className="flex w-full flex-col gap-3 border-t border-line pt-3">
              <p className="text-[13px] font-semibold">Báo cáo cuối ngày <span className="font-normal text-ink-muted">· bắt buộc trước khi check-out</span></p>
              <label className="flex flex-col gap-1">
                <span className="text-[12.5px] text-ink-muted">Hôm nay đã xong tính năng nào?</span>
                <Textarea rows={2} value={report.done} onChange={(e) => setReport((x) => ({ ...x, done: e.target.value }))} placeholder="VD: Xong màn đăng ký lịch, sửa bug IDOR…" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[12.5px] text-ink-muted">Đang làm tính năng nào?</span>
                <Textarea rows={2} value={report.inProgress} onChange={(e) => setReport((x) => ({ ...x, inProgress: e.target.value }))} placeholder="VD: Đang làm báo cáo cuối ngày…" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[12.5px] text-ink-muted">Có vấn đề gì cần trao đổi không? <span className="text-ink-faint">(tuỳ chọn)</span></span>
                <Textarea rows={2} value={report.issues} onChange={(e) => setReport((x) => ({ ...x, issues: e.target.value }))} placeholder="VD: Cần clarify yêu cầu X với PM…" />
              </label>
              {!reportValid && <p className="text-[12px] text-ink-faint">Điền ít nhất mục &ldquo;đã xong&rdquo; hoặc &ldquo;đang làm&rdquo; để check-out.</p>}
            </div>
          )}
          <Button variant="primary" className="h-11 w-full text-[14px]" loading={busy} disabled={!status.valid || (!isIn && !reportValid)} onClick={act}>
            <IconClock size={15} /> {isIn ? "Check in" : "Check out"}
          </Button>
        </>
      )}
    </div>
  );
}
