"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteLabel, deleteWorkspace, getWorkspaceHistory, getWorkspaceLabels, getWhatsNew, patchLabel, patchWorkspace } from "@/lib/api/endpoints";
import { fetchAll } from "@/lib/query/paged";
import { qk } from "@/lib/query/keys";
import { LABEL_COLORS } from "@/lib/domain/label";
import { fmtDate, fmtRelative } from "@/lib/domain/format";
import { uploadFile } from "@/lib/upload";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { useAttendanceMutations, useAttendanceSettings, useWorkWeek } from "@/lib/hooks/attendance";
import { useKpiSettings, usePerformanceMutations } from "@/lib/hooks/performance";
import { useFeedbackSettings } from "@/lib/hooks/feedback";
import { useToast } from "@/lib/toast/ToastProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Alert, Badge, Skeleton } from "@/components/ui/feedback";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Input } from "@/components/ui/form";
import { Modal } from "@/components/ui/Modal";
import { useConfirm } from "@/components/ui/Confirm";
import { LabelChip } from "@/components/kairso/LabelChip";
import { ResourcePanel } from "@/components/kairso/ResourcePanel";
import { ReleaseNotes } from "@/components/kairso/ReleaseNotes";
import { IconClose, IconEdit, IconMapPin, IconPlus, IconTrash } from "@/components/icons";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/state";
import { weekdayName } from "@/lib/domain/format";
import { enablePush, pushPermission } from "@/lib/firebase/messaging";

const Card = ({ title, children, hint }: { title: string; hint?: string; children: React.ReactNode }) => (
  <section className="rounded-lg border border-line bg-surface p-4"><h2 className="text-[14px] font-semibold">{title}</h2>{hint && <p className="mb-3 text-[12.5px] text-ink-muted">{hint}</p>}<div className={hint ? "" : "mt-3"}>{children}</div></section>
);

export function WorkspaceSection() {
  const { workspace, workspaceId, isHolder, isManager, workspaces, setWorkspaceId } = useWorkspace();
  const toast = useToast();
  const qc = useQueryClient();
  const router = useRouter();
  const [name, setName] = useState(workspace?.name ?? "");
  useEffect(() => setName(workspace?.name ?? ""), [workspace?.name]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [typed, setTyped] = useState("");
  const [del, setDel] = useState(false);
  const save = useMutation({ mutationFn: (b: { name?: string; avatar?: string }) => patchWorkspace(workspaceId, b), onSuccess: () => (qc.invalidateQueries({ queryKey: ["workspaces"] }), toast.success(tr().ops.saved)), onError: (e) => toast.error(e) });
  const remove = useMutation({
    mutationFn: () => deleteWorkspace(workspaceId),
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["workspaces"] }); const next = workspaces.find((w) => w.id !== workspaceId); if (next) setWorkspaceId(next.id); toast.success(tr().ops.wsDeleted); router.replace("/"); },
    onError: (e) => toast.error(e),
  });
  if (!workspace) return null;
  return (
    <div className="flex flex-col gap-5">
      <Card title={tr().ops.wsInfo}>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-medium text-ink-2">{tr().ops.avatar}</span>
            <div className="flex items-center gap-3">
              <Avatar person={{ id: workspace.id, name: workspace.name, avatar: workspace.avatar }} size="xl" />
              {isManager && (<><input ref={fileRef} type="file" accept="image/*" className="sr-only" aria-label={tr().ops.pickAvatar} onChange={async (e) => { const f = e.target.files?.[0]; if (f) { try { save.mutate({ avatar: (await uploadFile(f, "workspace_file", workspaceId)).fileUrl }); } catch (er) { toast.error(er); } } }} /><Button size="sm" onClick={() => fileRef.current?.click()}>{tr().ops.changeAvatar}</Button></>)}
            </div>
          </div>
          <Field label={tr().ops.wsName} className="min-w-[240px] flex-1">{(p) => <Input {...p} disabled={!isManager} value={name} onChange={(e) => setName(e.target.value)} />}</Field>
          {isManager && <Button variant="primary" loading={save.isPending} disabled={!name.trim() || name.trim() === workspace.name} onClick={() => save.mutate({ name: name.trim() })}>{tr().ops.save}</Button>}
        </div>
        <p className="mt-3 text-[12px] text-ink-faint">{tr().ops.createdOn(fmtDate(workspace.createdAt))}</p>
      </Card>
      {isHolder && (
        <section className="rounded-lg border border-danger-border p-4">
          <h2 className="mb-1 text-[14px] font-semibold text-danger">{tr().ops.danger}</h2>
          <p className="mb-3 text-[13px] text-ink-muted">{tr().ops.dangerDesc}</p>
          <Button variant="danger" onClick={() => setDel(true)}><IconTrash size={13} /> {tr().ops.deleteWs}</Button>
        </section>
      )}
      <Modal open={del} onClose={() => (setDel(false), setTyped(""))} title={tr().ops.confirmDeleteWs(workspace.name)} width={440}
        footer={<><Button onClick={() => (setDel(false), setTyped(""))}>{tr().ops.cancel}</Button><Button variant="danger" loading={remove.isPending} disabled={typed !== workspace.name} onClick={() => remove.mutate()}>{tr().ops.deleteForever}</Button></>}>
        <Field label={tr().ops.typeToConfirm(workspace.name)}>{(p) => <Input {...p} autoFocus value={typed} onChange={(e) => setTyped(e.target.value)} />}</Field>
      </Modal>
    </div>
  );
}

export const ResourcesSection = () => <ResourcePanel scope={{ ws: useWorkspace().workspaceId }} />;

export function LabelsSection() {
  const { workspaceId, projects, isManager } = useWorkspace();
  const toast = useToast();
  const confirm = useConfirm();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: qk.labels(workspaceId), queryFn: async () => (await getWorkspaceLabels(workspaceId, { projectIds: projects.map((p) => p.id).join(",") })).items ?? [], enabled: !!workspaceId && projects.length > 0 });
  const refresh = () => qc.invalidateQueries({ queryKey: ["labels"] });
  const upd = useMutation({ mutationFn: (v: { id: string; name: string; color: string }) => patchLabel(v.id, { name: v.name, color: v.color }), onSuccess: () => (refresh(), qc.invalidateQueries({ queryKey: ["tasks"] })), onError: (e) => toast.error(e) });
  const del = useMutation({ mutationFn: (id: string) => deleteLabel(id), onSuccess: () => (refresh(), qc.invalidateQueries({ queryKey: ["tasks"] })), onError: (e) => toast.error(e) });
  const [edit, setEdit] = useState<{ id: string; name: string; color: string } | null>(null);
  if (q.isLoading) return <Skeleton className="h-40" />;
  return (
    <div className="flex flex-col gap-4">
      {projects.map((p) => {
        const list = (q.data ?? []).filter((l) => l.projectId === p.id);
        return (
          <Card key={p.id} title={p.name}>
            {list.length === 0 ? <p className="text-[13px] text-ink-muted">{tr().ops.noLabels}</p> : (
              <ul className="flex flex-wrap gap-2">
                {list.map((l) => (
                  <li key={l.id} className="flex items-center gap-1">
                    <LabelChip name={l.name} color={l.color} />
                    {isManager && (<><button type="button" aria-label={tr().ops.editLabelOf(l.name)} onClick={() => setEdit({ id: l.id, name: l.name, color: l.color })} className="text-ink-faint hover:text-ink"><IconEdit size={12} /></button>
                    <button type="button" aria-label={tr().ops.deleteLabelOf(l.name)} onClick={async () => { if (await confirm({ title: tr().ops.confirmDeleteLabel(l.name), message: tr().ops.labelRemovedDesc, danger: true })) del.mutate(l.id); }} className="text-ink-faint hover:text-danger"><IconClose size={12} /></button></>)}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        );
      })}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={tr().ops.editLabel} width={400}>
        {edit && (
          <form onSubmit={(e) => (e.preventDefault(), edit.name.trim() && upd.mutate({ ...edit, name: edit.name.trim() }, { onSuccess: () => setEdit(null) }))} className="flex flex-col gap-3">
            <Field label={tr().ops.labelName}>{(p) => <Input {...p} autoFocus value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />}</Field>
            <div className="flex gap-1.5" role="radiogroup" aria-label={tr().ops.labelColor}>{LABEL_COLORS.map((c) => <button key={c} type="button" role="radio" aria-checked={c === edit.color} aria-label={tr().ops.color(c)} onClick={() => setEdit({ ...edit, color: c })} className={`size-6 rounded-full ${c === edit.color ? "ring-2 ring-accent ring-offset-2 ring-offset-surface" : ""}`} style={{ background: c }} />)}</div>
            <div className="flex justify-end gap-2"><Button onClick={() => setEdit(null)}>{tr().ops.cancel}</Button><Button type="submit" variant="primary" loading={upd.isPending}>{tr().ops.save}</Button></div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export function AttendanceSection() {
  const { workspaceId, isManager } = useWorkspace();
  const toast = useToast();
  const q = useAttendanceSettings(workspaceId);
  const m = useAttendanceMutations(workspaceId);
  const [f, setF] = useState({ validationEnabled: false, companyLatitude: "", companyLongitude: "", allowedRadiusMeters: "100", companyWifiBSSID: "", companyWifiSSID: "" });
  useEffect(() => { if (q.data) setF({ validationEnabled: q.data.validationEnabled, companyLatitude: String(q.data.companyLatitude), companyLongitude: String(q.data.companyLongitude), allowedRadiusMeters: String(q.data.allowedRadiusMeters), companyWifiBSSID: q.data.companyWifiBSSID, companyWifiSSID: q.data.companyWifiSSID ?? "" }); }, [q.data]);
  if (q.isLoading) return <Skeleton className="h-64" />;
  const locate = () => navigator.geolocation?.getCurrentPosition((p) => setF((x) => ({ ...x, companyLatitude: String(p.coords.latitude), companyLongitude: String(p.coords.longitude) })), () => toast.error(tr().ops.noLocation), { enableHighAccuracy: true, timeout: 10000 });
  const lat = Number(f.companyLatitude);
  const lng = Number(f.companyLongitude);
  const valid = Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && Number(f.allowedRadiusMeters) > 0 && (!f.validationEnabled || f.companyWifiBSSID.trim());
  return (
    <div className="flex flex-col gap-4">
      {!isManager && <Alert>{tr().ops.attAdminOnly}</Alert>}
      <Card title={tr().ops.attValidation} hint={tr().ops.attValidationHint}>
        <div className="flex flex-col gap-3">
          <Checkbox label={tr().ops.attEnable} disabled={!isManager} checked={f.validationEnabled} onChange={(e) => setF({ ...f, validationEnabled: e.target.checked })} />
          {f.validationEnabled && <Alert tone="warning">{tr().ops.attWebNote}</Alert>}
          <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
            <Field label={tr().ops.lat}>{(p) => <Input {...p} className="font-mono" disabled={!isManager} value={f.companyLatitude} onChange={(e) => setF({ ...f, companyLatitude: e.target.value })} />}</Field>
            <Field label={tr().ops.lng}>{(p) => <Input {...p} className="font-mono" disabled={!isManager} value={f.companyLongitude} onChange={(e) => setF({ ...f, companyLongitude: e.target.value })} />}</Field>
          </div>
          {isManager && <div><Button size="sm" onClick={locate}><IconMapPin size={13} /> {tr().ops.useLocation}</Button></div>}
          <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
            <Field label={tr().ops.radius}>{(p) => <Input {...p} type="number" min={1} className="font-mono" disabled={!isManager} value={f.allowedRadiusMeters} onChange={(e) => setF({ ...f, allowedRadiusMeters: e.target.value })} />}</Field>
            <Field label="Wi-Fi BSSID" required={f.validationEnabled}>{(p) => <Input {...p} className="font-mono" placeholder="aa:bb:cc:dd:ee:ff" disabled={!isManager} value={f.companyWifiBSSID} onChange={(e) => setF({ ...f, companyWifiBSSID: e.target.value })} />}</Field>
            <Field label="Wi-Fi SSID">{(p) => <Input {...p} disabled={!isManager} value={f.companyWifiSSID} onChange={(e) => setF({ ...f, companyWifiSSID: e.target.value })} />}</Field>
          </div>
          {isManager && <div><Button variant="primary" loading={m.saveSettings.isPending} disabled={!valid} onClick={() => m.saveSettings.mutate({ validationEnabled: f.validationEnabled, companyLatitude: lat, companyLongitude: lng, allowedRadiusMeters: Number(f.allowedRadiusMeters), companyWifiBSSID: f.companyWifiBSSID.trim(), companyWifiSSID: f.companyWifiSSID.trim() || undefined }, { onSuccess: () => toast.success(tr().ops.attSaved), onError: (e) => toast.error(e) })}>{tr().ops.save}</Button></div>}
        </div>
      </Card>
    </div>
  );
}

const dowName = (d: number) => weekdayName(new Date(2024, 0, 7 + d));
type WS = Record<number, Array<{ startTime: string; endTime: string }>>;

export function ShiftsSection() {
  const { workspaceId, isManager } = useWorkspace();
  const toast = useToast();
  const q = useWorkWeek(workspaceId);
  const m = useAttendanceMutations(workspaceId);
  const [w, setW] = useState<WS>({});
  useEffect(() => { if (q.data) setW(Object.fromEntries((q.data.days ?? []).map((d) => [d.dayOfWeek, (d.sessions ?? []).map((s) => ({ startTime: s.startTime, endTime: s.endTime }))]))); }, [q.data]);
  if (q.isLoading) return <Skeleton className="h-64" />;
  const bad = Object.values(w).some((l) => l.some((s) => !s.startTime || !s.endTime || s.endTime <= s.startTime));
  return (
    <Card title={tr().ops.defaultWeek} hint={tr().ops.defaultWeekHint}>
      {!isManager && <Alert className="mb-3">{tr().ops.defaultAdminOnly}</Alert>}
      <ul className="flex flex-col divide-y divide-line-row">
        {[1, 2, 3, 4, 5, 6, 0].map((d) => {
          const list = w[d] ?? [];
          return (
            <li key={d} className="flex flex-wrap items-start gap-3 py-2">
              <span className="w-24 pt-1 text-[13px] font-medium">{dowName(d)}</span>
              <div className="flex flex-1 flex-col gap-1.5">
                {list.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="time" aria-label={tr().ops.shiftStart(dowName(d), i + 1)} disabled={!isManager} value={s.startTime} onChange={(e) => setW({ ...w, [d]: list.map((x, j) => (j === i ? { ...x, startTime: e.target.value } : x)) })} className="h-ctl-sm rounded-md border border-line-strong bg-surface px-2 font-mono text-[12.5px]" />
                    <span className="text-ink-faint">→</span>
                    <input type="time" aria-label={tr().ops.shiftEnd(dowName(d), i + 1)} disabled={!isManager} value={s.endTime} onChange={(e) => setW({ ...w, [d]: list.map((x, j) => (j === i ? { ...x, endTime: e.target.value } : x)) })} className={`h-ctl-sm rounded-md border bg-surface px-2 font-mono text-[12.5px] ${s.endTime <= s.startTime ? "border-danger" : "border-line-strong"}`} />
                    {isManager && <button type="button" aria-label={tr().ops.removeShift} onClick={() => setW({ ...w, [d]: list.filter((_, j) => j !== i) })} className="text-ink-faint hover:text-danger"><IconClose size={12} /></button>}
                  </div>
                ))}
                {list.length === 0 && <span className="pt-1 text-[12.5px] text-ink-muted">{tr().ops.off}</span>}
                {isManager && list.length < 3 && <div><Button size="sm" variant="ghost" onClick={() => setW({ ...w, [d]: [...list, { startTime: "08:00", endTime: "17:00" }] })}><IconPlus size={12} /> {tr().ops.addShift}</Button></div>}
              </div>
            </li>
          );
        })}
      </ul>
      {isManager && <div className="mt-3"><Button variant="primary" loading={m.saveWorkWeek.isPending} disabled={bad} onClick={() => m.saveWorkWeek.mutate({ days: Object.entries(w).filter(([, l]) => l.length).map(([d, l]) => ({ dayOfWeek: Number(d), sessions: l })) }, { onSuccess: () => toast.success(tr().ops.defaultSaved), onError: (e) => toast.error(e) })}>{tr().ops.save}</Button></div>}
    </Card>
  );
}

const KPI_FIELDS = ["progressWeight", "qualityWeight", "punctualityWeight", "attitudeWeight", "initiativeWeight", "customerWeight"] as const;

export function KpiSection() {
  const { workspaceId, isHolder } = useWorkspace();
  const toast = useToast();
  const q = useKpiSettings(workspaceId, isHolder);
  const { saveKpiSettings } = usePerformanceMutations(workspaceId);
  const [w, setW] = useState<Record<string, string>>({});
  useEffect(() => { if (q.data) setW(Object.fromEntries(KPI_FIELDS.map((k) => [k, String(q.data![k])]))); }, [q.data]);
  if (!isHolder) return <Alert tone="warning">{tr().ops.kpiOwnerOnly}</Alert>;
  if (q.isLoading) return <Skeleton className="h-48" />;
  const sum = KPI_FIELDS.reduce((n, [k]) => n + (Number(w[k]) || 0), 0);
  return (
    <Card title={tr().ops.kpiWeights} hint={tr().ops.kpiHint}>
      <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-2">
        {KPI_FIELDS.map((k) => <Field key={k} label={tr().kpiField[k]}>{(p) => <Input {...p} type="number" min={0} className="font-mono" value={w[k] ?? ""} onChange={(e) => setW({ ...w, [k]: e.target.value })} />}</Field>)}
      </div>
      <p className={`mt-3 text-[13px] ${sum === 100 ? "text-success" : "text-warning"}`}>{tr().ops.total} <span className="font-mono font-semibold">{sum}</span> {sum !== 100 && tr().ops.not100}</p>
      <div className="mt-3"><Button variant="primary" loading={saveKpiSettings.isPending} onClick={() => saveKpiSettings.mutate(Object.fromEntries(KPI_FIELDS.map((k) => [k, Number(w[k]) || 0])) as never, { onSuccess: () => toast.success(tr().ops.kpiSaved), onError: (e) => toast.error(e) })}>{tr().ops.save}</Button></div>
    </Card>
  );
}

export function NotificationsSection() {
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");
  useEffect(() => setPerm(typeof Notification === "undefined" ? "unsupported" : Notification.permission), []);
  return (
    <div className="flex flex-col gap-4">
      <Card title={tr().ops.inApp} hint={tr().ops.inAppHint}>
        <Badge tone="success">{tr().ops.active}</Badge>
      </Card>
      <Card title={tr().ops.browser}>
        <p className="mb-2 text-[13px] text-ink-2">{tr().ops.permission} <Badge tone={perm === "granted" ? "success" : perm === "denied" ? "danger" : "neutral"}>{perm === "granted" ? tr().ops.granted : perm === "denied" ? tr().ops.denied : perm === "unsupported" ? tr().ops.unsupported : tr().ops.notAsked}</Badge></p>
        <p className="mb-3 text-[12.5px] text-ink-muted">{tr().ops.pushInfo}</p>
        {perm === "default" && <Button onClick={() => enablePush(getLang()).then(() => setPerm(pushPermission()))}>{tr().ops.allow}</Button>}
        {perm === "denied" && <Alert tone="warning">{tr().ops.reenable}</Alert>}
      </Card>
    </div>
  );
}

export function IntegrationsSection() {
  const { workspaceId, projects, isManager } = useWorkspace();
  return (
    <div className="flex flex-col gap-4">
      <Card title={tr().ops.publicFb} hint={tr().ops.publicFbHint}>
        <ul className="divide-y divide-line-row">
          {projects.map((p) => <ProjectFeedbackRow key={p.id} id={p.id} name={p.name} ws={workspaceId} manage={isManager} />)}
          {projects.length === 0 && <li className="py-3 text-[13px] text-ink-muted">{tr().ops.noProjects}</li>}
        </ul>
      </Card>
    </div>
  );
}
function ProjectFeedbackRow({ id, name, ws, manage }: { id: string; name: string; ws: string; manage: boolean }) {
  const q = useFeedbackSettings(ws, id);
  const toast = useToast();
  const url = q.data?.token && typeof window !== "undefined" ? `${window.location.origin}/f/${q.data.token}` : "";
  return (
    <li className="flex flex-wrap items-center gap-3 py-2.5">
      <span className="min-w-[140px] flex-1 text-[13px] font-medium">{name}</span>
      <Badge tone={q.data?.enabled ? "success" : "neutral"}>{q.isLoading ? "…" : q.data?.enabled ? tr().ops.on : tr().ops.offState}</Badge>
      {q.data?.enabled && url && <Button size="sm" onClick={() => navigator.clipboard.writeText(url).then(() => toast.success(tr().ops.copied), () => toast.error(tr().ops.copyFailed))}>{tr().ops.copyLink}</Button>}
      {manage && <a href={`/projects/${id}/feedback`} className="text-[12.5px] font-medium text-accent-ink">{tr().ops.manage}</a>}
    </li>
  );
}

export function AuditSection() {
  const { workspaceId } = useWorkspace();
  const q = useQuery({ queryKey: [...qk.history(workspaceId), "audit"], queryFn: () => fetchAll((p) => getWorkspaceHistory(workspaceId, p), 50, 4), enabled: !!workspaceId });
  if (q.isLoading) return <Skeleton className="h-48" />;
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <ul>
        {(q.data ?? []).map((h) => (
          <li key={h.id} className="flex items-center gap-3 border-b border-line-row px-4 py-2 text-[12.5px] last:border-b-0">
            <Avatar person={{ id: h.changedBy.id, name: h.changedBy.name, avatar: h.changedBy.avatar }} size="xs" />
            <span className="min-w-0 flex-1 truncate"><span className="font-medium">{h.changedBy.name}</span> {tr().ops.changed} <span className="font-medium">{h.field}</span>{h.oldValue || h.newValue ? <span className="text-ink-muted"> : {h.oldValue || "—"} → {h.newValue || "—"}</span> : null}</span>
            <span className="shrink-0 text-[11.5px] text-ink-faint">{fmtRelative(h.createdAt)}</span>
          </li>
        ))}
        {q.data?.length === 0 && <li className="px-4 py-8 text-center text-[13px] text-ink-muted">{tr().ops.noChanges}</li>}
      </ul>
    </div>
  );
}

export function WhatsNewSection() {
  const q = useQuery({ queryKey: qk.whatsNew(), queryFn: () => fetchAll((p) => getWhatsNew(p), 20, 3) });
  if (q.isLoading) return <Skeleton className="h-48" />;
  return (
    <div className="flex flex-col gap-4">
      {(q.data ?? []).map((r) => (
        <Card key={r.id} title={tr().ops.version(r.version)}>
          <p className="-mt-2 mb-2 font-mono text-[11.5px] text-ink-faint">{fmtDate(r.publishedAt)}</p>
          <ReleaseNotes notes={r.notes ?? []} />
        </Card>
      ))}
      {q.data?.length === 0 && <p className="text-[13px] text-ink-muted">{tr().ops.noNotes}</p>}
    </div>
  );
}
