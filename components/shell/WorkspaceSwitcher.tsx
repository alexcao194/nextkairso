"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getInvitations, postWorkspaceInvitationAccept, postWorkspaceInvitationReject } from "@/lib/api/endpoints";
import { fetchAll } from "@/lib/query/paged";
import { qk } from "@/lib/query/keys";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { useToast } from "@/lib/toast/ToastProvider";
import { Popover } from "@/components/ui/Popover";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { IconCheck, IconChevronDown, IconPlus } from "@/components/icons";
import { useDialogs } from "@/components/dialogs/DialogProvider";

export function WorkspaceSwitcher({ collapsed }: { collapsed?: boolean }) {
  const { workspaces, workspace, setWorkspaceId } = useWorkspace();
  const { openCreateWorkspace } = useDialogs();
  const toast = useToast();
  const qc = useQueryClient();

  const invitations = useQuery({ queryKey: qk.invitations(), queryFn: () => fetchAll((q) => getInvitations(q)) });
  const pending = (invitations.data ?? []).filter((i) => i.status === "pending");

  const respond = useMutation({
    mutationFn: ({ ws, id, accept }: { ws: string; id: string; accept: boolean }) =>
      accept ? postWorkspaceInvitationAccept(ws, id) : postWorkspaceInvitationReject(ws, id),
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: qk.invitations() });
      if (v.accept) {
        qc.invalidateQueries({ queryKey: qk.workspaces() });
        toast.success("Đã tham gia workspace");
      }
    },
    onError: (e) => toast.error(e),
  });

  const initial = (workspace?.name ?? "K").charAt(0).toUpperCase();

  return (
    <Popover
      minWidth={264}
      trigger={({ ref, open, ...p }) => (
        <button
          ref={ref}
          type="button"
          {...p}
          className={`mx-1.5 mt-1.5 flex h-topbar w-[calc(100%-12px)] items-center rounded-lg text-left hover:bg-hover ${
            collapsed ? "justify-center px-0" : "gap-2.5 px-2.5"
          }`}
          aria-label={`Workspace: ${workspace?.name ?? ""}`}
        >
          {workspace?.avatar ? (
            <Avatar person={{ id: workspace.id, name: workspace.name, avatar: workspace.avatar }} size="md" />
          ) : (
            <span style={{ background: "var(--brand-grad)" }} className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-[14px] font-bold text-white shadow-accent">
              {initial}
            </span>
          )}
          {!collapsed && (
            <>
              <span className="flex-1 truncate text-[13px] font-semibold">{workspace?.name ?? "Kairso"}</span>
              {pending.length > 0 && <span className="size-2 rounded-full bg-danger" aria-label="Có lời mời mới" />}
              <IconChevronDown size={14} className={`text-ink-faint transition-transform ${open ? "rotate-180" : ""}`} />
            </>
          )}
        </button>
      )}
    >
      {(close) => (
        <div className="flex w-[264px] flex-col">
          <p className="px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-ink-faint">Workspace</p>
          {workspaces.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => {
                setWorkspaceId(w.id);
                close();
              }}
              className={`flex h-9 items-center gap-2 rounded-md px-2 text-left text-[13px] hover:bg-hover ${
                w.id === workspace?.id ? "font-medium text-ink" : "text-ink-2"
              }`}
            >
              <span className="inline-flex size-5 shrink-0 items-center justify-center rounded bg-accent text-[11px] font-bold text-accent-on">
                {w.name.charAt(0).toUpperCase()}
              </span>
              <span className="flex-1 truncate">{w.name}</span>
              {w.id === workspace?.id && <IconCheck size={14} className="shrink-0 text-accent" />}
            </button>
          ))}

          {pending.length > 0 && (
            <>
              <div className="my-1 h-px bg-line" />
              <p className="px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
                Lời mời ({pending.length})
              </p>
              {pending.map((inv) => (
                <div key={inv.id} className="flex flex-col gap-1.5 rounded-md px-2 py-1.5">
                  <p className="text-[12.5px] text-ink">
                    <span className="font-medium">{inv.inviterName}</span> mời bạn vào{" "}
                    <span className="font-medium">{inv.workspaceName}</span>
                  </p>
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="primary"
                      loading={respond.isPending}
                      onClick={() => respond.mutate({ ws: inv.workspaceId, id: inv.id, accept: true })}
                    >
                      Tham gia
                    </Button>
                    <Button
                      size="sm"
                      disabled={respond.isPending}
                      onClick={() => respond.mutate({ ws: inv.workspaceId, id: inv.id, accept: false })}
                    >
                      Từ chối
                    </Button>
                  </div>
                </div>
              ))}
            </>
          )}

          <div className="my-1 h-px bg-line" />
          <button
            type="button"
            onClick={() => {
              close();
              openCreateWorkspace();
            }}
            className="flex h-9 items-center gap-2 rounded-md px-2 text-[13px] text-ink-2 hover:bg-hover"
          >
            <IconPlus size={14} className="text-ink-faint" />
            Tạo workspace mới
          </button>
        </div>
      )}
    </Popover>
  );
}
