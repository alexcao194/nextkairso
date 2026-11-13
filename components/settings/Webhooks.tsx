"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteWorkspaceWebhook,
  getWorkspaceWebhookDeliveries,
  getWorkspaceWebhooks,
  postWorkspaceWebhooks,
  postWorkspaceWebhookTest,
  putWorkspaceWebhook,
} from "@/lib/api/endpoints";
import type { WebhookRequest, WebhookResponse } from "@/lib/api/schema";
import { qk } from "@/lib/query/keys";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { fmtDateTime, fmtRelative } from "@/lib/domain/format";
import { useT } from "@/lib/i18n";
import { useToast } from "@/lib/toast/ToastProvider";
import { Button, IconButton } from "@/components/ui/Button";
import { Alert, Badge, EmptyState, ErrorState, SkeletonRows } from "@/components/ui/feedback";
import { Field, Input, Switch } from "@/components/ui/form";
import { Modal } from "@/components/ui/Modal";
import { Menu } from "@/components/ui/Popover";
import { useConfirm } from "@/components/ui/Confirm";
import { IconClock, IconCopy, IconEdit, IconLink, IconMore, IconPlus, IconSend, IconTrash } from "@/components/icons";

const DISABLE_AFTER = 20;

const PAYLOAD_EXAMPLE = `POST <URL>
Authorization: Bearer <token>
X-Kairso-Event: task.created
X-Kairso-Delivery: 6f1c…
X-Kairso-Signature: sha256=<hmac>

{
  "id": "6f1c…",
  "type": "task.created",
  "workspaceId": "…",
  "entityId": "…",
  "actorId": "…",
  "occurredAt": "2026-11-13T03:04:49Z",
  "data": { … }
}`;

export function WebhooksSection() {
  const tAll = useT();
  const t = tAll.webhooks;
  const toast = useToast();
  const confirm = useConfirm();
  const qc = useQueryClient();
  const { workspaceId, isManager } = useWorkspace();
  const [editing, setEditing] = useState<WebhookResponse | "new" | null>(null);
  const [logFor, setLogFor] = useState<WebhookResponse | null>(null);

  const q = useQuery({ queryKey: qk.webhooks(workspaceId), queryFn: () => getWorkspaceWebhooks(workspaceId), enabled: !!workspaceId && isManager });
  const refresh = () => qc.invalidateQueries({ queryKey: qk.webhooks(workspaceId) });
  const toggle = useMutation({
    mutationFn: (w: WebhookResponse) => putWorkspaceWebhook(workspaceId, w.id, { name: w.name, url: w.url, token: "", enabled: !w.enabled }),
    onSuccess: refresh,
    onError: (e) => toast.error(e),
  });
  const test = useMutation({
    mutationFn: (id: string) => postWorkspaceWebhookTest(workspaceId, id),
    onSuccess: (r) => {
      if (r.success) toast.success(t.testOk(r.statusCode, r.durationMs));
      else toast.error(t.testFail(r.error || `HTTP ${r.statusCode}`));
      refresh();
    },
    onError: (e) => toast.error(e),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteWorkspaceWebhook(workspaceId, id),
    onSuccess: () => { toast.success(t.deleted); refresh(); },
    onError: (e) => toast.error(e),
  });

  if (!isManager) return <Alert>{t.managerOnly}</Alert>;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] text-ink-2">{t.intro}</p>
      <div>
        <Button size="sm" variant="primary" onClick={() => setEditing("new")}><IconPlus size={13} /> {t.add}</Button>
      </div>

      {q.isLoading ? (
        <SkeletonRows rows={3} height={64} />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (q.data ?? []).length === 0 ? (
        <EmptyState icon={<IconLink size={28} />} title={t.empty} />
      ) : (
        <ul className="flex flex-col divide-y divide-line-row rounded-lg border border-line bg-surface">
          {(q.data ?? []).map((w) => {
            const autoOff = !w.enabled && w.failureCount >= DISABLE_AFTER;
            return (
              <li key={w.id} className="flex flex-col gap-1.5 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[13.5px] font-semibold">{w.name}</span>
                  <Badge tone={w.enabled ? "success" : "neutral"}>{w.enabled ? t.enabled : t.disabled}</Badge>
                  {w.enabled && w.failureCount > 0 && <Badge tone="warning">{t.failing(w.failureCount)}</Badge>}
                  <span className="flex-1" />
                  <Switch label={w.enabled ? t.disable : t.enable} checked={w.enabled} disabled={toggle.isPending} onChange={() => toggle.mutate(w)} />
                  <Button size="sm" variant="ghost" loading={test.isPending && test.variables === w.id} onClick={() => test.mutate(w.id)}>
                    <IconSend size={13} /> {t.test}
                  </Button>
                  <Menu
                    align="end"
                    trigger={({ ref, open: _o, ...p }) => (
                      <IconButton ref={ref} label={t.actionsOf(w.name)} variant="ghost" size="sm" {...p}><IconMore size={14} /></IconButton>
                    )}
                    items={[
                      { label: t.edit, icon: <IconEdit size={14} />, onSelect: () => setEditing(w) },
                      { label: t.deliveries, icon: <IconClock size={14} />, onSelect: () => setLogFor(w) },
                      {
                        label: t.copyToken,
                        icon: <IconCopy size={14} />,
                        onSelect: async () => {
                          try {
                            await navigator.clipboard.writeText(w.token);
                            toast.success(t.tokenCopied);
                          } catch {
                            window.prompt(t.token, w.token);
                          }
                        },
                      },
                      {
                        label: tAll.common.delete,
                        icon: <IconTrash size={14} />,
                        danger: true,
                        separated: true,
                        onSelect: async () => {
                          if (await confirm({ title: t.deleteConfirm(w.name), message: t.deleteDesc, danger: true })) remove.mutate(w.id);
                        },
                      },
                    ]}
                  />
                </div>
                <code className="truncate font-mono text-[12px] text-ink-2">{w.url}</code>
                <p className="text-[12px] text-ink-faint">
                  {w.lastDeliveredAt ? t.lastDelivery(fmtRelative(w.lastDeliveredAt), w.lastError || `HTTP ${w.lastStatus ?? "—"}`) : t.neverDelivered}
                </p>
                {autoOff && <Alert tone="warning">{t.autoDisabled(DISABLE_AFTER)}</Alert>}
              </li>
            );
          })}
        </ul>
      )}

      <section className="rounded-lg border border-line bg-surface p-4">
        <h2 className="text-[13px] font-semibold">{t.docsTitle}</h2>
        <p className="mt-1 text-[12.5px] text-ink-2">{t.docs}</p>
        <pre className="mt-2 overflow-x-auto rounded-md bg-surface-sunken p-3 font-mono text-[11.5px] leading-relaxed text-ink-2">{PAYLOAD_EXAMPLE}</pre>
        <p className="mt-2 text-[12px] text-ink-faint">{t.verifyHint}</p>
      </section>

      {editing && <WebhookModal webhook={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      {logFor && <DeliveriesModal webhook={logFor} onClose={() => setLogFor(null)} />}
    </div>
  );
}

function WebhookModal({ webhook, onClose }: { webhook: WebhookResponse | null; onClose: () => void }) {
  const t = useT();
  const toast = useToast();
  const qc = useQueryClient();
  const { workspaceId } = useWorkspace();
  const [form, setForm] = useState<WebhookRequest>({ name: webhook?.name ?? "", url: webhook?.url ?? "", token: "", enabled: webhook?.enabled ?? true });
  const save = useMutation({
    mutationFn: (body: WebhookRequest) => (webhook ? putWorkspaceWebhook(workspaceId, webhook.id, body) : postWorkspaceWebhooks(workspaceId, body)),
    onSuccess: () => {
      toast.success(t.webhooks.saved);
      qc.invalidateQueries({ queryKey: qk.webhooks(workspaceId) });
      onClose();
    },
    onError: (e) => toast.error(e),
  });
  const valid = form.name.trim() !== "" && /^https?:\/\/\S+$/i.test(form.url.trim());

  return (
    <Modal
      open
      onClose={onClose}
      width={560}
      title={webhook ? t.webhooks.edit : t.webhooks.add}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>{t.common.cancel}</Button>
          <Button variant="primary" disabled={!valid} loading={save.isPending} onClick={() => save.mutate(form)}>{t.common.save}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Field label={t.webhooks.name} required>
          {(p) => <Input {...p} autoFocus maxLength={255} placeholder={t.webhooks.namePlaceholder} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}
        </Field>
        <Field label={t.webhooks.url} required>
          {(p) => <Input {...p} type="url" maxLength={2048} placeholder="https://example.com/kairso-webhook" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="font-mono" />}
        </Field>
        <Field label={t.webhooks.token} hint={webhook ? t.webhooks.tokenKeep : t.webhooks.tokenHint}>
          {(p) => <Input {...p} maxLength={255} autoComplete="off" value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} className="font-mono" />}
        </Field>
        <Switch label={t.webhooks.enabled} checked={!!form.enabled} onChange={(v) => setForm({ ...form, enabled: v })} />
      </div>
    </Modal>
  );
}

function DeliveriesModal({ webhook, onClose }: { webhook: WebhookResponse; onClose: () => void }) {
  const t = useT().webhooks;
  const { workspaceId } = useWorkspace();
  const q = useQuery({
    queryKey: [...qk.webhooks(workspaceId), "deliveries", webhook.id],
    queryFn: () => getWorkspaceWebhookDeliveries(workspaceId, webhook.id),
  });
  return (
    <Modal open onClose={onClose} width={760} title={`${t.deliveries} · ${webhook.name}`}>
      {q.isLoading ? (
        <SkeletonRows rows={5} height={32} />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (q.data ?? []).length === 0 ? (
        <p className="py-6 text-center text-[13px] text-ink-faint">{t.noDeliveries}</p>
      ) : (
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead className="sticky top-0 bg-surface-sunken text-left text-[11px] font-medium uppercase tracking-wide text-ink-faint">
              <tr className="h-thead border-b border-line">
                <th className="px-2">{t.colTime}</th>
                <th className="px-2">{t.colEvent}</th>
                <th className="px-2">{t.colResult}</th>
                <th className="px-2 text-right">{t.colAttempts}</th>
                <th className="px-2 text-right">{t.colDuration}</th>
              </tr>
            </thead>
            <tbody>
              {(q.data ?? []).map((d) => (
                <tr key={d.id ?? d.eventId} className="h-row border-b border-line-row">
                  <td className="whitespace-nowrap px-2 text-ink-2">{fmtDateTime(d.createdAt)}</td>
                  <td className="px-2 font-mono text-[12px]">{d.eventType}</td>
                  <td className="px-2">
                    <Badge tone={d.success ? "success" : "danger"}>{d.success ? `${t.success} · ${d.statusCode}` : t.failed}</Badge>
                    {!d.success && d.error && <span className="ml-2 text-[12px] text-ink-faint">{d.error}</span>}
                  </td>
                  <td className="px-2 text-right font-mono">{d.attempts}</td>
                  <td className="px-2 text-right font-mono">{d.durationMs} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
