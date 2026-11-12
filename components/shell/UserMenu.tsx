"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { useLocale, useT } from "@/lib/i18n";
import { useToast } from "@/lib/toast/ToastProvider";
import { disablePush, enablePush } from "@/lib/firebase/messaging";
import { Menu } from "@/components/ui/Popover";
import { Avatar } from "@/components/ui/Avatar";
import { IconBell, IconChevronDown, IconLogout, IconSettings, IconUser, IconUsers, IconBulb } from "@/components/icons";
import { useDialogs } from "@/components/dialogs/DialogProvider";

const PUSH_TOKEN_KEY = "kairso-push-token";

export function UserMenu({ collapsed }: { collapsed?: boolean }) {
  const { user, logout } = useAuth();
  const { workspace } = useWorkspace();
  const { openProfile } = useDialogs();
  const { lang } = useLocale();
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const person = { id: user?.id, name: user?.name, avatar: user?.avatar };

  const [pushOn, setPushOn] = useState(false);
  useEffect(() => {
    try {
      setPushOn(!!localStorage.getItem(PUSH_TOKEN_KEY) && typeof Notification !== "undefined" && Notification.permission === "granted");
    } catch {
      /* ignore */
    }
  }, []);

  const togglePush = async () => {
    if (pushOn) {
      await disablePush();
      setPushOn(false);
      toast.info(t.settings.pushDisabled);
      return;
    }
    const result = await enablePush(lang);
    if (result === "enabled") {
      setPushOn(true);
      toast.success(t.settings.pushEnabled);
    } else if (result === "blocked") {
      toast.error(t.settings.pushBlocked);
    } else if (result === "unsupported") {
      toast.error(t.settings.pushUnsupported);
    } else if (result === "no-vapid") {
      toast.error(t.settings.pushNoVapid);
    } else {
      toast.error(t.settings.pushUnsupported);
    }
  };

  const workspaceSettingsLabel =
    lang === "en" ? `${workspace?.name ?? "workspace"} settings` : `${t.settingsNav.settings} ${workspace?.name ?? "workspace"}`;

  return (
    <Menu
      minWidth={232}
      trigger={({ ref, open, ...p }) => (
        <button
          ref={ref}
          type="button"
          {...p}
          className={`group flex min-w-0 flex-1 items-center rounded-md p-1 text-left hover:bg-hover ${collapsed ? "justify-center" : "gap-2"}`}
          aria-label={t.userMenu.aria}
        >
          <Avatar person={person} size="md" />
          {!collapsed && (
            <>
              <span className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate text-[12.5px] font-medium text-ink">{user?.name ?? t.userMenu.userFallback}</span>
                <span className="truncate text-[10.5px] text-ink-faint">{user?.email ?? `@${user?.alias ?? ""}`}</span>
              </span>
              <IconChevronDown size={12} className="mr-1 shrink-0 text-ink-faint" />
            </>
          )}
        </button>
      )}
      items={[
        { label: t.userMenu.account, icon: <IconUser size={14} />, onSelect: openProfile },
        { label: pushOn ? t.userMenu.disablePush : t.userMenu.enablePush, icon: <IconBell size={14} />, onSelect: togglePush },
        { label: workspaceSettingsLabel, icon: <IconSettings size={14} />, onSelect: () => router.push("/settings/workspace") },
        { label: t.userMenu.members, icon: <IconUsers size={14} />, onSelect: () => router.push("/settings/members") },
        { label: t.userMenu.whatsNew, icon: <IconBulb size={14} />, onSelect: () => router.push("/settings/whats-new") },
        {
          label: t.userMenu.logout,
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
