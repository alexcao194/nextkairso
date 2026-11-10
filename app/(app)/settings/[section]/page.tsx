"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { Invites, Members, Roles } from "@/components/settings/People";
import { AttendanceSection, AuditSection, IntegrationsSection, KpiSection, LabelsSection, NotificationsSection, ResourcesSection, ShiftsSection, WhatsNewSection, WorkspaceSection } from "@/components/settings/Ops";

const SECTIONS: Record<string, { title: string; el: () => React.ReactNode }> = {
  members: { title: "Thành viên", el: () => <Members /> },
  invites: { title: "Lời mời đang chờ", el: () => <Invites /> },
  roles: { title: "Vai trò & quyền", el: () => <Roles /> },
  workspace: { title: "Thông tin workspace", el: () => <WorkspaceSection /> },
  resources: { title: "Tài nguyên workspace", el: () => <ResourcesSection /> },
  labels: { title: "Nhãn theo dự án", el: () => <LabelsSection /> },
  attendance: { title: "Chấm công", el: () => <AttendanceSection /> },
  shifts: { title: "Ca làm việc", el: () => <ShiftsSection /> },
  kpi: { title: "KPI", el: () => <KpiSection /> },
  notifications: { title: "Thông báo", el: () => <NotificationsSection /> },
  integrations: { title: "Tích hợp", el: () => <IntegrationsSection /> },
  audit: { title: "Nhật ký thay đổi", el: () => <AuditSection /> },
  "whats-new": { title: "Có gì mới", el: () => <WhatsNewSection /> },
};

export default function SettingsSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = use(params);
  const s = SECTIONS[section];
  if (!s) notFound();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-[20px] font-semibold">{s.title}</h1>
      {s.el()}
    </div>
  );
}
