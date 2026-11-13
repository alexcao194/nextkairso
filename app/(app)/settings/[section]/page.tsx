"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { Invites, Members, Roles } from "@/components/settings/People";
import { AttendanceSection, AuditSection, IntegrationsSection, KpiSection, LabelsSection, NotificationsSection, ResourcesSection, ShiftsSection, WhatsNewSection, WorkspaceSection } from "@/components/settings/Ops";
import { WebhooksSection } from "@/components/settings/Webhooks";
import { tr } from "@/lib/i18n";

const SECTIONS: Record<string, { title: string; el: () => React.ReactNode }> = {
  members: { get title() { return tr().sectionTitle.members; }, el: () => <Members /> },
  invites: { get title() { return tr().sectionTitle.invites; }, el: () => <Invites /> },
  roles: { get title() { return tr().sectionTitle.roles; }, el: () => <Roles /> },
  workspace: { get title() { return tr().sectionTitle.workspace; }, el: () => <WorkspaceSection /> },
  resources: { get title() { return tr().sectionTitle.resources; }, el: () => <ResourcesSection /> },
  labels: { get title() { return tr().sectionTitle.labels; }, el: () => <LabelsSection /> },
  attendance: { get title() { return tr().sectionTitle.attendance; }, el: () => <AttendanceSection /> },
  shifts: { get title() { return tr().sectionTitle.shifts; }, el: () => <ShiftsSection /> },
  kpi: { title: "KPI", el: () => <KpiSection /> },
  notifications: { get title() { return tr().sectionTitle.notifications; }, el: () => <NotificationsSection /> },
  integrations: { get title() { return tr().sectionTitle.integrations; }, el: () => <IntegrationsSection /> },
  webhooks: { get title() { return tr().sectionTitle.webhooks; }, el: () => <WebhooksSection /> },
  audit: { get title() { return tr().sectionTitle.audit; }, el: () => <AuditSection /> },
  "whats-new": { get title() { return tr().sectionTitle.whatsNew; }, el: () => <WhatsNewSection /> },
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
