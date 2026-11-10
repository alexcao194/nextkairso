"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getWorkspaceThreads } from "@/lib/api/endpoints";
import type { TaskResponse, ThreadResponse } from "@/lib/api/schema";
import { fetchAll } from "@/lib/query/paged";
import { qk } from "@/lib/query/keys";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { useUrlState } from "@/lib/hooks/useUrlState";
import { useTask } from "@/lib/hooks/tasks";
import { fmtRelative } from "@/lib/domain/format";
import { parseMentionSegments } from "@/lib/domain/mention";
import { markdownToPlain } from "@/lib/domain/markdownText";
import { TopBar, TopBarSpacer } from "@/components/shell/TopBar";
import { Breadcrumb } from "@/components/shell/Breadcrumb";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, EmptyState, ErrorState, Skeleton, SkeletonRows } from "@/components/ui/feedback";
import { CommentComposer, CommentList } from "@/components/kairso/TaskComments";
import { StatusChip } from "@/components/kairso/StatusChip";
import { IconArrowLeft, IconChat, IconExternal } from "@/components/icons";
import { IconButton } from "@/components/ui/Button";

const plain = (s: string) => markdownToPlain(parseMentionSegments(s).map((x) => x.text).join(""));

export default function ThreadsPage() {
  const { workspaceId, projectById } = useWorkspace();
  const [id, setId] = useUrlState("id", "");
  const q = useQuery({
    queryKey: qk.threads(workspaceId),
    queryFn: () => fetchAll<ThreadResponse>((p) => getWorkspaceThreads(workspaceId, p)),
    enabled: !!workspaceId,
  });
  const threads = q.data ?? [];

  return (
    <>
      <TopBar>
        <Breadcrumb items={[{ label: "Thảo luận" }]} />
        <TopBarSpacer />
        <span className="font-mono text-[12px] text-ink-muted">{threads.length} chủ đề</span>
      </TopBar>
      <div className="flex min-h-0 flex-1">
        <div className={`flex w-[400px] shrink-0 flex-col border-r border-line bg-surface max-lg:w-full ${id ? "max-lg:hidden" : ""}`}>
          {q.isLoading ? (
            <SkeletonRows rows={7} height={72} />
          ) : q.isError ? (
            <ErrorState error={q.error} onRetry={() => q.refetch()} />
          ) : threads.length === 0 ? (
            <EmptyState icon={<IconChat size={28} />} title="Không có thảo luận mới" description="Chủ đề xuất hiện khi task của bạn có bình luận chưa đọc hoặc bạn được @nhắc." className="flex-1" />
          ) : (
            <ul className="min-h-0 flex-1 overflow-y-auto">
              {threads.map((t) => {
                const active = t.id === id;
                const c = t.latestComment;
                return (
                  <li key={t.id} className="border-b border-line-row">
                    <button
                      type="button"
                      onClick={() => setId(t.id ?? null)}
                      aria-current={active ? "true" : undefined}
                      className={`relative flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-row-hover ${active ? "bg-accent-soft" : ""}`}
                    >
                      {active && <span className="absolute inset-y-0 left-0 w-0.5 bg-accent" aria-hidden="true" />}
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-ink-faint">{t.code}</span>
                        <span className="truncate text-[11.5px] text-ink-faint">{projectById(t.projectId)?.name}</span>
                        <span className="flex-1" />
                        {t.mentioned && <Badge tone="accent">@ Nhắc bạn</Badge>}
                        {!!t.unreadCommentCount && <Badge tone="danger">{t.unreadCommentCount} mới</Badge>}
                      </span>
                      <span className="truncate text-[13px] font-semibold text-ink">{t.title}</span>
                      {c && (
                        <span className="flex items-start gap-2">
                          <Avatar person={{ id: c.authorId, name: c.authorName, avatar: c.authorAvatar }} size="xs" />
                          <span className="line-clamp-2 min-w-0 flex-1 text-[12.5px] text-ink-2"><span className="font-medium">{c.authorName}: </span>{plain(c.content ?? "") || "Đính kèm file"}</span>
                          <span className="shrink-0 text-[11px] text-ink-faint">{fmtRelative(c.createdAt)}</span>
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className={`flex min-w-0 flex-1 flex-col bg-surface ${id ? "" : "max-lg:hidden"}`}>
          {id ? <ThreadPane taskId={id} onBack={() => setId(null)} /> : <EmptyState icon={<IconChat size={28} />} title="Chọn một chủ đề" description="Bình luận sẽ hiện ở đây." className="flex-1" />}
        </div>
      </div>
    </>
  );
}

function ThreadPane({ taskId, onBack }: { taskId: string; onBack: () => void }) {
  const task = useTask(taskId);
  const t: TaskResponse | undefined = task.data;
  return (
    <>
      <header className="flex min-h-14 shrink-0 items-center gap-3 border-b border-line px-4 py-2">
        <IconButton label="Quay lại danh sách" variant="ghost" size="sm" onClick={onBack} className="lg:hidden"><IconArrowLeft size={14} /></IconButton>
        {task.isLoading ? <Skeleton className="h-8 w-64" /> : t ? (
          <>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-[11.5px] text-ink-faint"><span className="font-mono">{t.code}</span><StatusChip status={t.status} size="sm" /></p>
              <h2 className="truncate text-[14px] font-semibold">{t.title}</h2>
            </div>
            <Link href={`/projects/${t.projectId}/tasks?task=${t.id}`} className="inline-flex h-ctl-sm items-center gap-1.5 rounded-md border border-line-strong px-2.5 text-[12px] text-ink-2 hover:bg-hover">
              <IconExternal size={12} /> Mở task
            </Link>
          </>
        ) : <span className="text-[13px] text-danger">Không tải được task</span>}
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto"><CommentList taskId={taskId} /></div>
      <CommentComposer taskId={taskId} />
    </>
  );
}
