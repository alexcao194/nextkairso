"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteWorkspaceProject,
  deleteWorkspaceProjectMember,
  getWorkspaceProjectHistory,
  getWorkspaceProjectMembers,
  patchWorkspaceProject,
  patchWorkspaceProjectMember,
  postWorkspaceProjectMembers,
} from "@/lib/api/endpoints";
import type { ProjectRole } from "@/lib/api/schema";
import { fetchAll } from "@/lib/query/paged";
import { qk } from "@/lib/query/keys";
import { canManageRole, ROLE_LABEL, roleRank } from "@/lib/domain/permissions";
import { fmtRelative, projectColor } from "@/lib/domain/format";
import { uploadFile } from "@/lib/upload";
import { useAuth } from "@/lib/auth/AuthContext";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { useToast } from "@/lib/toast/ToastProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/form";
import { Alert, Skeleton } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/Modal";
import { IconTrash } from "@/components/icons";
import { tr } from "@/lib/i18n";

const ROLES: ProjectRole[] = ["holder", "admin", "member"];

export default function ProjectSettingsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const { workspaceId, projectById, isManager, role: wsRole } = useWorkspace();
  const { user } = useAuth();
  const project = projectById(projectId);
  const toast = useToast();
  const qc = useQueryClient();
  const router = useRouter();

  const members = useQuery({
    queryKey: qk.projectMembers(workspaceId, projectId),
    queryFn: () => getWorkspaceProjectMembers(workspaceId, projectId, { limit: 200 }),
    enabled: !!workspaceId,
  });
  const myRole = members.data?.items?.find((m) => m.userId === user?.id)?.role;
  const canManage = isManager || myRole === "holder" || myRole === "admin";
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["project-members"] });
    qc.invalidateQueries({ queryKey: ["projects"] });
    qc.invalidateQueries({ queryKey: ["project"] });
  };
  const fail = { onError: (e: unknown) => toast.error(e) };

  const [name, setName] = useState(project?.name ?? "");
  useEffect(() => setName(project?.name ?? ""), [project?.name]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const rename = useMutation({
    mutationFn: (b: { name?: string; avatar?: string }) => patchWorkspaceProject(workspaceId, projectId, b),
    onSuccess: () => (refresh(), toast.success(tr().projSettings.updated)),
    onError: (e) => toast.error(e),
  });
  const addMember = useMutation({ mutationFn: (v: { userId: string; role: ProjectRole }) => postWorkspaceProjectMembers(workspaceId, projectId, v), onSuccess: refresh });
  const setRole = useMutation({ mutationFn: (v: { userId: string; role: ProjectRole }) => patchWorkspaceProjectMember(workspaceId, projectId, v.userId, { role: v.role }), onSuccess: refresh });
  const removeMember = useMutation({ mutationFn: (userId: string) => deleteWorkspaceProjectMember(workspaceId, projectId, userId), onSuccess: refresh });
  const [addId, setAddId] = useState("");
  const [addRole, setAddRole] = useState<ProjectRole>("member");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [typed, setTyped] = useState("");

  const del = useMutation({
    mutationFn: () => deleteWorkspaceProject(workspaceId, projectId),
    onSuccess: () => {
      refresh();
      toast.success(tr().projSettings.deleted);
      router.replace("/");
    },
    onError: (e) => toast.error(e),
  });

  const history = useQuery({ queryKey: qk.history(workspaceId, projectId), queryFn: () => fetchAll((q) => getWorkspaceProjectHistory(workspaceId, projectId, q), 30, 2), enabled: !!workspaceId });

  if (!project) return <div className="p-6"><Skeleton className="h-6 w-56" /></div>;
  const available = members.data?.availableMembers ?? [];

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[820px] flex-col gap-6 p-5">
        {!canManage && <Alert tone="info">{tr().projSettings.readOnly}</Alert>}

        <section aria-labelledby="ps-general" className="rounded-lg border border-line bg-surface p-4">
          <h2 id="ps-general" className="mb-3 text-[14px] font-semibold">{tr().projSettings.general}</h2>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-medium text-ink-2">{tr().projSettings.avatar}</span>
              <div className="flex items-center gap-3">
                {project.avatar ? <Avatar person={{ id: project.id, name: project.name, avatar: project.avatar }} size="xl" /> : (
                  <span className="inline-flex size-14 items-center justify-center rounded-lg text-[20px] font-bold text-white" style={{ background: projectColor(project.id) }}>{project.name.charAt(0).toUpperCase()}</span>
                )}
                {canManage && (
                  <>
                    <input ref={fileRef} type="file" accept="image/*" className="sr-only" aria-label={tr().projSettings.pickAvatar} onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setUploading(true);
                      try { rename.mutate({ avatar: (await uploadFile(f, "project_file", projectId)).fileUrl }); } catch (err) { toast.error(err); } finally { setUploading(false); }
                    }} />
                    <Button size="sm" loading={uploading} onClick={() => fileRef.current?.click()}>{tr().projSettings.changeAvatar}</Button>
                  </>
                )}
              </div>
            </div>
            <Field label={tr().projSettings.name} className="min-w-[240px] flex-1">
              {(p) => <Input {...p} value={name} disabled={!canManage} onChange={(e) => setName(e.target.value)} />}
            </Field>
            {canManage && <Button variant="primary" loading={rename.isPending} disabled={!name.trim() || name.trim() === project.name} onClick={() => rename.mutate({ name: name.trim() })}>{tr().projSettings.save}</Button>}
          </div>
        </section>

        <section aria-labelledby="ps-members" className="rounded-lg border border-line bg-surface">
          <h2 id="ps-members" className="border-b border-line px-4 py-3 text-[14px] font-semibold">{tr().projSettings.membersTitle(members.data?.items?.length ?? 0)}</h2>
          {members.isLoading ? <div className="p-4"><Skeleton className="h-16" /></div> : (
            <ul>
              {(members.data?.items ?? []).map((m) => (
                <li key={m.userId} className="flex min-h-[48px] items-center gap-3 border-b border-line-row px-4 py-1.5 last:border-b-0">
                  <Avatar person={{ id: m.userId, name: m.userName, avatar: m.userAvatar }} size="md" />
                  <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-medium">{m.userName}</span><span className="block truncate text-[11.5px] text-ink-faint">@{m.userAlias}</span></span>
                  <Select small aria-label={tr().projSettings.roleOf(m.userName)} className="w-36" disabled={!canManage || m.userId === user?.id || !canManageRole(wsRole, m.role)} value={m.role} onChange={(e) => setRole.mutate({ userId: m.userId, role: e.target.value as ProjectRole }, fail)}>
                    {ROLES.filter((r) => !wsRole || roleRank(wsRole) >= roleRank(r)).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                  </Select>
                  {canManage && m.userId !== user?.id && canManageRole(wsRole, m.role) && <Button size="sm" variant="ghost" aria-label={tr().projSettings.removeOf(m.userName)} onClick={() => removeMember.mutate(m.userId, fail)}><IconTrash size={13} /></Button>}
                </li>
              ))}
            </ul>
          )}
          {canManage && (
            <div className="flex flex-wrap items-end gap-2 border-t border-line p-3">
              <Field label={tr().projSettings.addMember} className="min-w-[200px] flex-1">
                {(p) => (
                  <Select {...p} value={addId} onChange={(e) => setAddId(e.target.value)}>
                    <option value="">{available.length ? tr().projSettings.pickMember : tr().projSettings.allIn}</option>
                    {available.map((a) => <option key={a.userId} value={a.userId}>{a.userName} (@{a.userAlias})</option>)}
                  </Select>
                )}
              </Field>
              <Field label={tr().projSettings.role} className="w-36">{(p) => <Select {...p} value={addRole} onChange={(e) => setAddRole(e.target.value as ProjectRole)}>{ROLES.filter((r) => !wsRole || roleRank(wsRole) >= roleRank(r)).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</Select>}</Field>
              <Button variant="primary" disabled={!addId} loading={addMember.isPending} onClick={() => addMember.mutate({ userId: addId, role: addRole }, { onSuccess: () => setAddId(""), ...fail })}>{tr().projSettings.add}</Button>
            </div>
          )}
        </section>

        <section aria-labelledby="ps-history" className="rounded-lg border border-line bg-surface">
          <h2 id="ps-history" className="border-b border-line px-4 py-3 text-[14px] font-semibold">{tr().projSettings.history}</h2>
          <ul className="max-h-[260px] overflow-y-auto">
            {history.isLoading && <li className="p-4"><Skeleton className="h-10" /></li>}
            {(history.data ?? []).map((h) => (
              <li key={h.id} className="flex items-center gap-2 border-b border-line-row px-4 py-2 text-[12.5px] last:border-b-0">
                <span className="font-medium">{h.changedBy?.name}</span>
                <span className="text-ink-muted">{tr().projSettings.changedField(h.field)}</span>
                <span className="ml-auto text-[11.5px] text-ink-faint">{fmtRelative(h.createdAt)}</span>
              </li>
            ))}
            {history.data?.length === 0 && <li className="px-4 py-6 text-center text-ink-muted">{tr().projSettings.noHistory}</li>}
          </ul>
        </section>

        {canManage && (
          <section aria-labelledby="ps-danger" className="rounded-lg border border-danger-border p-4">
            <h2 id="ps-danger" className="mb-1 text-[14px] font-semibold text-danger">{tr().projSettings.danger}</h2>
            <p className="mb-3 text-[13px] text-ink-muted">{tr().projSettings.dangerDesc}</p>
            <Button variant="danger" onClick={() => setConfirmDelete(true)}><IconTrash size={13} /> {tr().projSettings.delete}</Button>
          </section>
        )}
      </div>

      <Modal open={confirmDelete} onClose={() => (setConfirmDelete(false), setTyped(""))} title={tr().projSettings.confirmTitle(project.name)} width={440}
        footer={<><Button onClick={() => (setConfirmDelete(false), setTyped(""))}>{tr().projSettings.cancel}</Button><Button variant="danger" loading={del.isPending} disabled={typed !== project.name} onClick={() => del.mutate()}>{tr().projSettings.deleteForever}</Button></>}>
        <Field label={tr().projSettings.typeToConfirm(project.name)}>{(p) => <Input {...p} value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus />}</Field>
      </Modal>
    </div>
  );
}
