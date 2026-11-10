"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { Menu } from "@/components/ui/Popover";
import { Avatar } from "@/components/ui/Avatar";
import { IconChevronDown, IconLogout, IconSettings, IconUser, IconUsers, IconBulb } from "@/components/icons";
import { useDialogs } from "@/components/dialogs/DialogProvider";

export function UserMenu({ collapsed }: { collapsed?: boolean }) {
  const { user, logout } = useAuth();
  const { workspace } = useWorkspace();
  const { openProfile } = useDialogs();
  const router = useRouter();
  const person = { id: user?.id, name: user?.name, avatar: user?.avatar };

  return (
    <Menu
      minWidth={232}
      trigger={({ ref, open, ...p }) => (
        <button
          ref={ref}
          type="button"
          {...p}
          className={`group flex min-w-0 flex-1 items-center rounded-md p-1 text-left hover:bg-hover ${collapsed ? "justify-center" : "gap-2"}`}
          aria-label="Tài khoản"
        >
          <Avatar person={person} size="md" />
          {!collapsed && (
            <>
              <span className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate text-[12.5px] font-medium text-ink">{user?.name ?? "Người dùng"}</span>
                <span className="truncate text-[10.5px] text-ink-faint">{user?.email ?? `@${user?.alias ?? ""}`}</span>
              </span>
              <IconChevronDown size={12} className="mr-1 shrink-0 text-ink-faint" />
            </>
          )}
        </button>
      )}
      items={[
        { label: "Thông tin tài khoản", icon: <IconUser size={14} />, onSelect: openProfile },
        { label: `Cài đặt ${workspace?.name ?? "workspace"}`, icon: <IconSettings size={14} />, onSelect: () => router.push("/settings/workspace") },
        { label: "Thành viên", icon: <IconUsers size={14} />, onSelect: () => router.push("/settings/members") },
        { label: "Có gì mới", icon: <IconBulb size={14} />, onSelect: () => router.push("/settings/whats-new") },
        {
          label: "Đăng xuất",
          icon: <IconLogout size={14} />,
          danger: true,
          separated: true,
          onSelect: async () => {
            await logout();
            router.replace("/login");
          },
        },
      ]}
    />
  );
}
