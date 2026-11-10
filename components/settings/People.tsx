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
                <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-medium">{m.userName}{self && <span className="ml-1.5 text-[11.5px] font-normal text-ink-faint">(bạn)</span>}</span><span className="block truncate text-[11.5px] text-ink-faint">@{m.userAlias}</span></span>
                <Select small aria-label={`Vai trò của ${m.userName}`} className="w-40" disabled={!isManager || self || !canManage} value={m.role} onChange={(e) => setRole.mutate({ id: m.userId, role: e.target.value as WorkspaceRole })}>
                  {ROLES.filter((r) => !myRole || roleRank(myRole) >= roleRank(r)).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                </Select>
                {isManager && !self && canManage && (
                  <Button size="sm" variant="ghost" aria-label={`Xoá ${m.userName}`} onClick={async () => { if (await confirm({ title: `Xoá ${m.userName} khỏi workspace?`, message: "Họ sẽ mất quyền truy cập mọi dự án trong workspace.", danger: true })) remove.mutate(m.userId); }}><IconTrash size={13} /></Button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      {isManager ? <InviteBar /> : <Alert>Chỉ quản trị viên mới mời được thành viên.</Alert>}
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
    onSuccess: () => { toast.success("Đã gửi lời mời"); setAlias(""); qc.invalidateQueries({ queryKey: ["members"] }); },
    onError: (e) => toast.error(e),
  });
  return (
    <form onSubmit={(e) => (e.preventDefault(), alias.trim() && invite.mutate())} className="sticky bottom-0 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface p-3">
      <label htmlFor="inv-alias" className="sr-only">Alias người được mời</label>
      <Input id="inv-alias" small className="min-w-[200px] flex-1" placeholder="Mời bằng alias, VD: nguyenvana" value={alias} onChange={(e) => setAlias(e.target.value)} />
      <Select small aria-label="Vai trò" className="w-40" value={role} onChange={(e) => setRole(e.target.value as WorkspaceRole)}>
        {ROLES.filter((r) => !myRole || roleRank(myRole) >= roleRank(r)).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
      </Select>
      <Button type="submit" variant="primary" loading={invite.isPending} disabled={!alias.trim()}>Mời</Button>
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
      {pending.length === 0 ? <p className="rounded-lg border border-line bg-surface px-4 py-8 text-center text-[13px] text-ink-muted">Không có lời mời nào đang chờ.</p> : (
        <ul className="overflow-hidden rounded-lg border border-line bg-surface">
          {pending.map((m) => (
            <li key={m.userId} className="flex min-h-[48px] items-center gap-3 border-b border-line-row px-4 py-1.5 last:border-b-0">
              <Avatar person={{ id: m.userId, name: m.userName, avatar: m.userAvatar }} size="md" />
              <span className="min-w-0 flex-1 text-[13px]"><span className="font-medium">{m.userName}</span> <span className="text-ink-faint">@{m.userAlias}</span></span>
              <Badge tone="warning">Chờ chấp nhận</Badge><Badge>{ROLE_LABEL[m.role]}</Badge>
              {isManager && m.invitationId && <Button size="sm" variant="ghost" loading={cancel.isPending} onClick={() => cancel.mutate(m.invitationId!)}>Huỷ lời mời</Button>}
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
    ["Mời, xoá thành viên và đổi vai trò", false, true, true],
    ["Thêm / đổi vai trò thành viên dự án", false, true, true],
    ["Duyệt lịch làm việc, yêu cầu bổ sung công", false, true, true],
    ["Xem lịch chấm công cả đội, chấm điểm thái độ", false, true, true],
    ["Cấu hình KPI (trọng số)", false, false, true],
    ["Quản lý định nghĩa quy trình, xem mọi yêu cầu", false, false, true],
  ];
  const yes = <span aria-label="Có" className="font-semibold text-success">Có</span>;
  const no = <span aria-label="Không" className="text-ink-disabled">—</span>;
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <table className="w-full text-[13px]">
        <thead className="text-left text-[11px] font-medium uppercase tracking-wide text-ink-faint"><tr className="h-thead border-b border-line"><th className="px-4">Quyền</th><th className="px-2 text-center">Thành viên</th><th className="px-2 text-center">Quản trị</th><th className="px-2 text-center">Chủ workspace</th></tr></thead>
        <tbody>{rows.map(([label, m, a, h]) => <tr key={label} className="h-10 border-b border-line-row last:border-b-0"><td className="px-4">{label}</td><td className="text-center">{m ? yes : no}</td><td className="text-center">{a ? yes : no}</td><td className="text-center">{h ? yes : no}</td></tr>)}</tbody>
      </table>
      <p className="border-t border-line px-4 py-2 text-[12px] text-ink-muted">Chỉ nêu các quyền đặc biệt; mọi thao tác thông thường (task, bình luận, chấm công cá nhân) dành cho mọi thành viên. Quyền thực tế luôn do máy chủ quyết định.</p>
    </div>
  );
}
