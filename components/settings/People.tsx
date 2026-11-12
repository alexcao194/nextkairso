"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteWorkspaceInvitation, deleteWorkspaceMember, getWorkspaceMembers, patchWorkspaceMember, postWorkspaceInvitations } from "@/lib/api/endpoints";
import { fetchAll } from "@/lib/query/paged";
import { qk } from "@/lib/query/keys";
import type { WorkspaceRole } from "@/lib/api/schema";
import { canManageRole, ROLE_LABEL, roleRank } from "@/lib/domain/permissions";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { useToast } from "@/lib/toast/ToastProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, Alert } from "@/components/ui/feedback";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/form";
import { useConfirm } from "@/components/ui/Confirm";
import { IconTrash } from "@/components/icons";
import { tr } from "@/lib/i18n";

const ROLES: WorkspaceRole[] = ["holder", "admin", "member"];

export function Members() {
  const { workspaceId, isManager, role: myRole } = useWorkspace();
  const all = useAllMembers();
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["members"] });
  const setRole = useMutation({ mutationFn: (v: { id: string; role: WorkspaceRole }) => patchWorkspaceMember(workspaceId, v.id, { role: v.role }), onSuccess: refresh, onError: (e) => toast.error(e) });
  const remove = useMutation({ mutationFn: (id: string) => deleteWorkspaceMember(workspaceId, id), onSuccess: refresh, onError: (e) => toast.error(e) });
  const members = all.filter((m) => m.status === "accepted");

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <ul>
          {members.map((m) => {
            const self = m.userId === user?.id;
            const canManage = canManageRole(myRole, m.role);
            return (
              <li key={m.userId} className="flex min-h-[48px] items-center gap-3 border-b border-line-row px-4 py-1.5 last:border-b-0">
                <Avatar person={{ id: m.userId, name: m.userName, avatar: m.userAvatar }} size="md" />
                <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-medium">{m.userName}{self && <span className="ml-1.5 text-[11.5px] font-normal text-ink-faint">{tr().people.you}</span>}</span><span className="block truncate text-[11.5px] text-ink-faint">@{m.userAlias}</span></span>
                <Select small aria-label={tr().people.roleOf(m.userName)} className="w-40" disabled={!isManager || self || !canManage} value={m.role} onChange={(e) => setRole.mutate({ id: m.userId, role: e.target.value as WorkspaceRole })}>
                  {ROLES.filter((r) => !myRole || roleRank(myRole) >= roleRank(r)).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                </Select>
                {isManager && !self && canManage && (
                  <Button size="sm" variant="ghost" aria-label={tr().people.removeOf(m.userName)} onClick={async () => { if (await confirm({ title: tr().people.confirmRemove(m.userName), message: tr().people.removeDesc, danger: true })) remove.mutate(m.userId); }}><IconTrash size={13} /></Button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      {isManager ? <InviteBar /> : <Alert>{tr().people.inviteAdminOnly}</Alert>}
    </div>
  );
}

function useAllMembers() {
  const { workspaceId } = useWorkspace();
  return useAllMembersRaw(workspaceId);
}
function useAllMembersRaw(ws: string) {
  const q = useQuery({ queryKey: [...qk.members(ws), "all"], queryFn: () => fetchAll((p) => getWorkspaceMembers(ws, p)), enabled: !!ws });
  return q.data ?? [];
}

function InviteBar() {
  const { workspaceId, role: myRole } = useWorkspace();
  const toast = useToast();
  const qc = useQueryClient();
  const [alias, setAlias] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("member");
  const invite = useMutation({
    mutationFn: () => postWorkspaceInvitations(workspaceId, { userAlias: alias.trim().replace(/^@/, ""), role }),
    onSuccess: () => { toast.success(tr().people.invited); setAlias(""); qc.invalidateQueries({ queryKey: ["members"] }); },
    onError: (e) => toast.error(e),
  });
  return (
    <form onSubmit={(e) => (e.preventDefault(), alias.trim() && invite.mutate())} className="sticky bottom-0 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface p-3">
      <label htmlFor="inv-alias" className="sr-only">{tr().people.inviteAlias}</label>
      <Input id="inv-alias" small className="min-w-[200px] flex-1" placeholder={tr().people.invitePh} value={alias} onChange={(e) => setAlias(e.target.value)} />
      <Select small aria-label={tr().people.role} className="w-40" value={role} onChange={(e) => setRole(e.target.value as WorkspaceRole)}>
        {ROLES.filter((r) => !myRole || roleRank(myRole) >= roleRank(r)).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
      </Select>
      <Button type="submit" variant="primary" loading={invite.isPending} disabled={!alias.trim()}>{tr().people.invite}</Button>
    </form>
  );
}

export function Invites() {
  const { workspaceId, isManager } = useWorkspace();
  const all = useAllMembers();
  const toast = useToast();
  const qc = useQueryClient();
  const cancel = useMutation({ mutationFn: (id: string) => deleteWorkspaceInvitation(workspaceId, id), onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }), onError: (e) => toast.error(e) });
  const pending = all.filter((m) => m.status === "pending");
  return (
    <div className="flex flex-col gap-4">
      {pending.length === 0 ? <p className="rounded-lg border border-line bg-surface px-4 py-8 text-center text-[13px] text-ink-muted">{tr().people.noInvites}</p> : (
        <ul className="overflow-hidden rounded-lg border border-line bg-surface">
          {pending.map((m) => (
            <li key={m.userId} className="flex min-h-[48px] items-center gap-3 border-b border-line-row px-4 py-1.5 last:border-b-0">
              <Avatar person={{ id: m.userId, name: m.userName, avatar: m.userAvatar }} size="md" />
              <span className="min-w-0 flex-1 text-[13px]"><span className="font-medium">{m.userName}</span> <span className="text-ink-faint">@{m.userAlias}</span></span>
              <Badge tone="warning">{tr().people.pending}</Badge><Badge>{ROLE_LABEL[m.role]}</Badge>
              {isManager && m.invitationId && <Button size="sm" variant="ghost" loading={cancel.isPending} onClick={() => cancel.mutate(m.invitationId!)}>{tr().people.cancelInvite}</Button>}
            </li>
          ))}
        </ul>
      )}
      {isManager && <InviteBar />}
    </div>
  );
}

export function Roles() {
  const rows: Array<[string, boolean, boolean, boolean]> = [
    [tr().people.perm1, false, true, true],
    [tr().people.perm2, false, true, true],
    [tr().people.perm3, false, true, true],
    [tr().people.perm4, false, true, true],
    [tr().people.perm5, false, false, true],
  ];
  const yes = <span aria-label={tr().people.yes} className="font-semibold text-success">{tr().people.yes}</span>;
  const no = <span aria-label={tr().people.no} className="text-ink-disabled">—</span>;
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <table className="w-full text-[13px]">
        <thead className="text-left text-[11px] font-medium uppercase tracking-wide text-ink-faint"><tr className="h-thead border-b border-line"><th className="px-4">{tr().people.permission}</th><th className="px-2 text-center">{tr().people.member}</th><th className="px-2 text-center">{tr().people.admin}</th><th className="px-2 text-center">{tr().people.holder}</th></tr></thead>
        <tbody>{rows.map(([label, m, a, h]) => <tr key={label} className="h-10 border-b border-line-row last:border-b-0"><td className="px-4">{label}</td><td className="text-center">{m ? yes : no}</td><td className="text-center">{a ? yes : no}</td><td className="text-center">{h ? yes : no}</td></tr>)}</tbody>
      </table>
      <p className="border-t border-line px-4 py-2 text-[12px] text-ink-muted">{tr().people.permNote}</p>
    </div>
  );
}
