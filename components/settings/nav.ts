export const SETTINGS_NAV: Array<{ group: string; items: Array<{ slug: string; label: string; managerOnly?: boolean }> }> = [
  { group: "Con người", items: [{ slug: "members", label: "Thành viên" }, { slug: "invites", label: "Lời mời" }, { slug: "roles", label: "Vai trò & quyền" }] },
  { group: "Workspace", items: [{ slug: "workspace", label: "Thông tin chung" }, { slug: "resources", label: "Tài nguyên" }, { slug: "labels", label: "Nhãn" }] },
  { group: "Vận hành", items: [{ slug: "attendance", label: "Chấm công" }, { slug: "shifts", label: "Ca làm việc" }, { slug: "kpi", label: "KPI", managerOnly: true }] },
  { group: "Hệ thống", items: [{ slug: "notifications", label: "Thông báo" }, { slug: "integrations", label: "Tích hợp" }, { slug: "audit", label: "Nhật ký thay đổi" }, { slug: "whats-new", label: "Có gì mới" }] },
];

