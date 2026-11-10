"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { Sidebar } from "@/components/shell/Sidebar";
import { MobileNav } from "@/components/shell/MobileNav";
import { OfflineBanner } from "@/components/shell/OfflineBanner";
import { DialogProvider, useDialogs } from "@/components/dialogs/DialogProvider";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { Button } from "@/components/ui/Button";
import { IconClose, IconFolder } from "@/components/icons";

const COLLAPSE_KEY = "kairso-sidebar-collapsed";

function Splash() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div style={{ background: "var(--brand-grad)" }} className="flex size-10 animate-pulse items-center justify-center rounded-xl text-base font-bold text-white shadow-accent">K</div>
        <span className="text-xs font-medium text-ink-muted">Đang tải Kairso…</span>
      </div>
    </div>
  );
}

function NoWorkspace() {
  const { openCreateWorkspace } = useDialogs();
  return (
    <EmptyState
      className="flex-1"
      icon={<IconFolder size={28} />}
      title="Bạn chưa thuộc workspace nào"
      description="Tạo workspace mới, hoặc nhờ quản trị viên mời bạn bằng alias — lời mời sẽ hiện ở bộ chuyển workspace."
      action={<Button variant="primary" onClick={openCreateWorkspace}>Tạo workspace</Button>}
    />
  );
}

function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { workspaceId, isLoading } = useWorkspace();
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* bỏ qua */
    }
  }, []);
  useEffect(() => setDrawer(false), [pathname]);

  const toggle = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      } catch {
        /* bỏ qua */
      }
      return !c;
    });

  return (
    <div className="flex h-dvh overflow-hidden">
      <div className="max-sm:hidden">
        <Sidebar collapsed={collapsed} onToggleCollapse={toggle} />
      </div>

      {drawer && (
        <div className="fixed inset-0 z-40 sm:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" aria-label="Đóng menu" className="absolute inset-0 bg-[var(--scrim)]" onClick={() => setDrawer(false)} />
          <div className="relative h-full w-[300px] max-w-[86vw]">
            <Sidebar onNavigate={() => setDrawer(false)} />
            <button
              type="button"
              aria-label="Đóng menu"
              onClick={() => setDrawer(false)}
              className="absolute -right-11 top-2 flex size-9 items-center justify-center rounded-full bg-surface text-ink shadow-md"
            >
              <IconClose size={16} />
            </button>
          </div>
        </div>
      )}

      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden pb-[60px] sm:pb-0">
        <OfflineBanner />
        {isLoading ? (
          <div className="flex flex-col gap-3 p-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-[58px] w-full" />
            <Skeleton className="h-[240px] w-full" />
          </div>
        ) : !workspaceId ? (
          <NoWorkspace />
        ) : (
          <Suspense fallback={<div className="p-6"><Skeleton className="h-6 w-48" /></div>}>{children}</Suspense>
        )}
      </main>
      <MobileNav onMenu={() => setDrawer(true)} />
    </div>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !token) router.replace("/login");
  }, [token, isLoading, router]);

  if (isLoading && !token) return <Splash />;
  if (!token) return null;

  return (
    <DialogProvider>
      <Shell>{children}</Shell>
    </DialogProvider>
  );
}
