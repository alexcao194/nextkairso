"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getWorkspaceNotifications, patchWorkspaceNotificationsRead } from "@/lib/api/endpoints";
import type { NotificationResponse } from "@/lib/api/schema";
import { qk } from "@/lib/query/keys";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { useUrlState } from "@/lib/hooks/useUrlState";
import { localizedNotification, notificationHref, notificationKind } from "@/lib/domain/notification";
import { fmtRelative } from "@/lib/domain/format";
import { useLocale, useT } from "@/lib/i18n";
import { useToast } from "@/lib/toast/ToastProvider";
import { TopBar, TopBarSpacer } from "@/components/shell/TopBar";
import { Breadcrumb } from "@/components/shell/Breadcrumb";
import { Button } from "@/components/ui/Button";
import { Badge, EmptyState, ErrorState, SkeletonRows } from "@/components/ui/feedback";
import { IconCheck, IconInbox } from "@/components/icons";

const PAGE = 30;

export default function InboxPage() {
  const t = useT();
  return (
    <>
      <TopBar>
        <Breadcrumb items={[{ label: t.nav.inbox }]} />
        <TopBarSpacer />
      </TopBar>
      <Notifications />
    </>
  );
}

function Notifications() {
  const { workspaceId } = useWorkspace();
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const t = useT();
  const { lang } = useLocale();
  const [filter, setFilter] = useUrlState("filter", "all");

  const q = useInfiniteQuery({
    queryKey: [...qk.notifications(workspaceId), "infinite"],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => getWorkspaceNotifications(workspaceId, { page: pageParam, limit: PAGE }),
    getNextPageParam: (last) => (last.hasMore ? (last.page ?? 1) + 1 : undefined),
    enabled: !!workspaceId,
  });
  const all = useMemo(() => q.data?.pages.flatMap((p) => p.items ?? []) ?? [], [q.data]);
  const list = filter === "unread" ? all.filter((n) => !n.readAt) : all;
  const unread = all.filter((n) => !n.readAt);

  const markRead = useMutation({
    mutationFn: (ids: string[]) => patchWorkspaceNotificationsRead(workspaceId, { ids }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
    onError: (e) => toast.error(e),
  });

  const open = (n: NotificationResponse) => {
    if (!n.readAt) markRead.mutate([n.id]);
    const href = notificationHref(n);
    if (href) router.push(href);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-surface">
      <div className="flex h-toolbar shrink-0 items-center gap-2 border-b border-line px-4">
        {(["all", "unread"] as const).map((f) => (
          <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f === "all" ? null : f)} className={`h-ctl-sm rounded-md px-2.5 text-[12.5px] ${filter === f ? "bg-hover font-medium text-ink" : "text-ink-muted hover:bg-hover"}`}>
            {f === "all" ? t.common.all : `${t.notif.unread}${unread.length ? ` (${unread.length})` : ""}`}
          </button>
        ))}
        <span className="flex-1" />
        <Button size="sm" variant="ghost" disabled={unread.length === 0} loading={markRead.isPending} onClick={() => markRead.mutate(unread.map((n) => n.id))}>
          <IconCheck size={13} /> {t.notif.markAllRead}
        </Button>
      </div>
      {q.isLoading ? (
        <SkeletonRows rows={8} height={64} />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState icon={<IconInbox size={28} />} title={filter === "unread" ? t.notif.emptyUnread : t.notif.inboxEmpty} className="flex-1" />
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {list.map((n) => {
            const kind = notificationKind(n.data?.type);
            const clickable = !!notificationHref(n);
            const text = localizedNotification(n, lang);
            return (
              <li key={n.id} className="border-b border-line-row">
                <button type="button" onClick={() => open(n)} disabled={!clickable && !!n.readAt} className={`flex min-h-16 w-full items-start gap-3 px-4 py-3 text-left hover:bg-row-hover ${n.readAt ? "" : "bg-accent-soft/40"}`}>
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.readAt ? "bg-transparent" : "bg-accent"}`} aria-label={n.readAt ? t.notif.read : t.notif.unread} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <Badge>{t.notif.kind[kind]}</Badge>
                      <span className="truncate text-[13px] font-semibold">{text.title}</span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-[12.5px] text-ink-2">{text.body}</span>
                  </span>
                  <span className="shrink-0 text-[11.5px] text-ink-faint">{fmtRelative(n.createdAt)}</span>
                </button>
              </li>
            );
          })}
          {q.hasNextPage && (
            <li className="p-3 text-center"><Button size="sm" loading={q.isFetchingNextPage} onClick={() => q.fetchNextPage()}>Tải thêm</Button></li>
          )}
        </ul>
      )}
    </div>
  );
}
