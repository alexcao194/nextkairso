"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CustomerRequest, CustomerResponse, QuoteSettingsRequest } from "@/lib/api/schema";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { useUrlState } from "@/lib/hooks/useUrlState";
import { useCustomerMutations, useCustomers, useQuoteSettings, useQuoteSettingsMutation, useQuotes } from "@/lib/hooks/quotes";
import { formatMoney } from "@/lib/domain/money";
import { fmtDate } from "@/lib/domain/format";
import { useLocale, useT } from "@/lib/i18n";
import { useToast } from "@/lib/toast/ToastProvider";
import { TopBar, TopBarSpacer } from "@/components/shell/TopBar";
import { Breadcrumb } from "@/components/shell/Breadcrumb";
import { Tabs } from "@/components/ui/Tabs";
import { Button, IconButton } from "@/components/ui/Button";
import { Alert, EmptyState, ErrorState, SkeletonRows } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/Modal";
import { Menu } from "@/components/ui/Popover";
import { useConfirm } from "@/components/ui/Confirm";
import { IconEdit, IconFile, IconMore, IconPlus, IconTrash, IconUsers } from "@/components/icons";
import { CurrencySelect, NewQuoteModal, QuoteStatusBadge, useProjectModules } from "./shared";

type Tab = "quotes" | "customers" | "settings";

export function QuotesHome() {
  const t = useT();
  const { isManager } = useWorkspace();
  const [tab, setTab] = useUrlState("tab", "quotes");
  const [creating, setCreating] = useState(false);
  const [project] = useUrlState("project", "");
  const [mod] = useUrlState("module", "");

  return (
    <>
      <TopBar>
        <Breadcrumb items={[{ label: t.quotes.title }]} />
        <TopBarSpacer />
        {isManager && (
          <Button size="sm" variant="primary" onClick={() => setCreating(true)}>
            <IconPlus size={13} /> {t.quotes.newQuote}
          </Button>
        )}
      </TopBar>
      <div className="flex shrink-0 items-center border-b border-line bg-surface px-4">
        <Tabs<Tab>
          label={t.quotes.title}
          value={tab as Tab}
          onChange={(v) => setTab(v === "quotes" ? null : v)}
          tabs={[
            { value: "quotes", label: t.quotes.tabQuotes },
            { value: "customers", label: t.quotes.tabCustomers },
            { value: "settings", label: t.quotes.tabSettings },
          ]}
        />
      </div>
      {tab === "customers" ? <CustomersTab /> : tab === "settings" ? <SettingsTab /> : <QuoteList />}
      {creating && <NewQuoteModal open onClose={() => setCreating(false)} projectId={project} moduleId={mod} />}
    </>
  );
}

function QuoteList() {
  const t = useT();
  const { lang } = useLocale();
  const { workspaceId, projects } = useWorkspace();
  const [project, setProject] = useUrlState("project", "");
  const [mod, setMod] = useUrlState("module", "");
  const [status, setStatus] = useUrlState("status", "");
  const modules = useProjectModules(project);
  // "expired" is derived from a sent quote past its validity, so ask the server for "sent".
  const q = useQuotes(workspaceId, { projectId: project || undefined, moduleId: mod || undefined, status: status === "expired" ? "sent" : status || undefined });
  const rows = (q.data ?? []).filter((r) => (status === "expired" ? r.status === "expired" : status === "sent" ? r.status === "sent" : true));

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-surface">
      <div className="flex h-toolbar shrink-0 items-center gap-2 border-b border-line px-4">
        <Select small aria-label={t.quotes.pickProject} className="w-48" value={project} onChange={(e) => { setProject(e.target.value || null); setMod(null); }}>
          <option value="">{t.quotes.allProjects}</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
        <Select small aria-label={t.quotes.pickModule} className="w-48" value={mod} disabled={!project} onChange={(e) => setMod(e.target.value || null)}>
          <option value="">{t.quotes.allModules}</option>
          {(modules.data ?? []).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </Select>
        <Select small aria-label={t.quotes.colStatus} className="w-44" value={status} onChange={(e) => setStatus(e.target.value || null)}>
          <option value="">{t.quotes.allStatuses}</option>
          {Object.keys(t.quotes.status).map((s) => <option key={s} value={s}>{t.quotes.status[s]}</option>)}
        </Select>
      </div>
      {q.isLoading ? (
        <SkeletonRows rows={8} height={36} />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState className="flex-1" icon={<IconFile size={28} />} title={t.quotes.empty} description={t.quotes.emptyDesc} />
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[900px] border-collapse text-[13px]">
            <thead className="sticky top-0 z-10 bg-surface-sunken text-left text-[11px] font-medium uppercase tracking-wide text-ink-faint">
              <tr className="h-thead border-b border-line">
                <th className="px-4">{t.quotes.colNumber}</th>
                <th className="px-2">{t.quotes.colTitle}</th>
                <th className="px-2">{t.quotes.colModule}</th>
                <th className="px-2">{t.quotes.colCustomer}</th>
                <th className="px-2">{t.quotes.colDate}</th>
                <th className="px-2">{t.quotes.colValid}</th>
                <th className="px-2 text-right">{t.quotes.colTotal}</th>
                <th className="px-4">{t.quotes.colStatus}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="h-row border-b border-line-row hover:bg-row-hover">
                  <td className="px-4 font-mono text-[12px]">
                    <Link href={`/quotes/${r.id}`} className="font-medium text-ink hover:text-accent-ink">{r.number}</Link>
                  </td>
                  <td className="max-w-64 truncate px-2">{r.title || "—"}</td>
                  <td className="max-w-56 truncate px-2 text-ink-2">{r.projectName} · {r.moduleName}</td>
                  <td className="max-w-48 truncate px-2">{r.customerName || "—"}</td>
                  <td className="px-2 text-ink-2">{fmtDate(r.issueDate)}</td>
                  <td className="px-2 text-ink-2">{r.validUntil ? fmtDate(r.validUntil) : "—"}</td>
                  <td className="px-2 text-right font-mono text-[12px]">{formatMoney(r.grandTotal, r.currency, r.minorUnits, lang)}</td>
                  <td className="px-4"><QuoteStatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const EMPTY_CUSTOMER: CustomerRequest = { name: "", taxCode: "", address: "", contactName: "", email: "", phone: "", note: "" };

function CustomersTab() {
  const t = useT();
  const toast = useToast();
  const confirm = useConfirm();
  const { workspaceId, isManager } = useWorkspace();
  const q = useCustomers(workspaceId);
  const { remove } = useCustomerMutations(workspaceId);
  const [editing, setEditing] = useState<CustomerResponse | "new" | null>(null);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-surface">
      {isManager && (
        <div className="flex h-toolbar shrink-0 items-center border-b border-line px-4">
          <Button size="sm" onClick={() => setEditing("new")}><IconPlus size={13} /> {t.customersTab.add}</Button>
        </div>
      )}
      {q.isLoading ? (
        <SkeletonRows rows={6} height={36} />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (q.data ?? []).length === 0 ? (
        <EmptyState className="flex-1" icon={<IconUsers size={28} />} title={t.customersTab.empty} />
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[800px] border-collapse text-[13px]">
            <thead className="sticky top-0 z-10 bg-surface-sunken text-left text-[11px] font-medium uppercase tracking-wide text-ink-faint">
              <tr className="h-thead border-b border-line">
                <th className="px-4">{t.customersTab.name}</th>
                <th className="px-2">{t.customersTab.taxCode}</th>
                <th className="px-2">{t.customersTab.contactName}</th>
                <th className="px-2">{t.customersTab.email}</th>
                <th className="px-2">{t.customersTab.phone}</th>
                <th className="w-12 px-2"><span className="sr-only">{t.quoteEditor.actions}</span></th>
              </tr>
            </thead>
            <tbody>
              {(q.data ?? []).map((c) => (
                <tr key={c.id} className="h-row border-b border-line-row hover:bg-row-hover">
                  <td className="px-4 font-medium">{c.name}</td>
                  <td className="px-2 font-mono text-[12px]">{c.taxCode || "—"}</td>
                  <td className="px-2">{c.contactName || "—"}</td>
                  <td className="px-2">{c.email || "—"}</td>
                  <td className="px-2">{c.phone || "—"}</td>
                  <td className="px-2">
                    {isManager && (
                      <Menu
                        align="end"
                        trigger={({ ref, open: _o, ...p }) => (
                          <IconButton ref={ref} label={t.customersTab.actionsOf(c.name)} variant="ghost" size="sm" {...p}><IconMore size={14} /></IconButton>
                        )}
                        items={[
                          { label: t.customersTab.edit, icon: <IconEdit size={14} />, onSelect: () => setEditing(c) },
                          {
                            label: t.common.delete,
                            icon: <IconTrash size={14} />,
                            danger: true,
                            separated: true,
                            onSelect: async () => {
                              if (await confirm({ title: t.customersTab.deleteConfirm(c.name), message: t.customersTab.deleteDesc, danger: true })) {
                                remove.mutate(c.id, { onSuccess: () => toast.success(t.customersTab.deleted), onError: (e) => toast.error(e) });
                              }
                            },
                          },
                        ]}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && <CustomerModal customer={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

export function CustomerModal({ customer, onClose, onSaved }: { customer: CustomerResponse | null; onClose: () => void; onSaved?: (c: CustomerResponse) => void }) {
  const t = useT();
  const toast = useToast();
  const { workspaceId } = useWorkspace();
  const { create, update } = useCustomerMutations(workspaceId);
  const [form, setForm] = useState<CustomerRequest>(customer ? { ...EMPTY_CUSTOMER, ...customer } : EMPTY_CUSTOMER);
  const set = (k: keyof CustomerRequest) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const busy = create.isPending || update.isPending;

  const submit = () => {
    const done = { onSuccess: (c: CustomerResponse) => { toast.success(t.customersTab.saved); onSaved?.(c); onClose(); }, onError: (e: unknown) => toast.error(e) };
    if (customer) update.mutate({ id: customer.id, body: form }, done);
    else create.mutate(form, done);
  };

  return (
    <Modal
      open
      onClose={onClose}
      width={560}
      title={customer ? t.customersTab.edit : t.customersTab.add}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>{t.common.cancel}</Button>
          <Button variant="primary" disabled={!form.name.trim()} loading={busy} onClick={submit}>{t.common.save}</Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label={t.customersTab.name} required className="col-span-2">{(p) => <Input {...p} value={form.name} onChange={set("name")} autoFocus />}</Field>
        <Field label={t.customersTab.taxCode}>{(p) => <Input {...p} value={form.taxCode} onChange={set("taxCode")} />}</Field>
        <Field label={t.customersTab.contactName}>{(p) => <Input {...p} value={form.contactName} onChange={set("contactName")} />}</Field>
        <Field label={t.customersTab.email}>{(p) => <Input {...p} type="email" value={form.email} onChange={set("email")} />}</Field>
        <Field label={t.customersTab.phone}>{(p) => <Input {...p} value={form.phone} onChange={set("phone")} />}</Field>
        <Field label={t.customersTab.address} className="col-span-2">{(p) => <Input {...p} value={form.address} onChange={set("address")} />}</Field>
        <Field label={t.customersTab.note} className="col-span-2">{(p) => <Textarea {...p} rows={2} value={form.note} onChange={set("note")} />}</Field>
      </div>
    </Modal>
  );
}

function SettingsTab() {
  const t = useT();
  const toast = useToast();
  const { workspaceId, isManager } = useWorkspace();
  const q = useQuoteSettings(workspaceId);
  const save = useQuoteSettingsMutation(workspaceId);
  const [form, setForm] = useState<QuoteSettingsRequest | null>(null);
  useEffect(() => {
    if (q.data) setForm({ ...q.data });
  }, [q.data]);

  if (q.isLoading || !form) return <SkeletonRows rows={6} height={40} />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;

  const set = <K extends keyof QuoteSettingsRequest>(k: K, v: QuoteSettingsRequest[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));
  const text = (k: keyof QuoteSettingsRequest) => (e: { target: { value: string } }) => set(k, e.target.value as never);
  const ro = !isManager;

  return (
    <div className="min-h-0 flex-1 overflow-auto bg-surface">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
        {ro && <Alert>{t.quoteSettings.managerOnly}</Alert>}
        <section className="flex flex-col gap-3">
          <h2 className="text-[14px] font-semibold">{t.quoteSettings.company}</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t.quoteSettings.companyName} className="col-span-2">{(p) => <Input {...p} disabled={ro} value={form.companyName} onChange={text("companyName")} />}</Field>
            <Field label={t.quoteSettings.taxCode}>{(p) => <Input {...p} disabled={ro} value={form.taxCode} onChange={text("taxCode")} />}</Field>
            <Field label={t.quoteSettings.phone}>{(p) => <Input {...p} disabled={ro} value={form.phone} onChange={text("phone")} />}</Field>
            <Field label={t.quoteSettings.email}>{(p) => <Input {...p} disabled={ro} type="email" value={form.email} onChange={text("email")} />}</Field>
            <Field label={t.quoteSettings.website}>{(p) => <Input {...p} disabled={ro} value={form.website} onChange={text("website")} />}</Field>
            <Field label={t.quoteSettings.address} className="col-span-2">{(p) => <Input {...p} disabled={ro} value={form.address} onChange={text("address")} />}</Field>
            <Field label={t.quoteSettings.bankInfo} className="col-span-2">{(p) => <Textarea {...p} disabled={ro} rows={3} value={form.bankInfo} onChange={text("bankInfo")} />}</Field>
            <Field label={t.quoteSettings.logoUrl}>{(p) => <Input {...p} disabled={ro} value={form.logoUrl} onChange={text("logoUrl")} />}</Field>
            <Field label={t.quoteSettings.signatureUrl}>{(p) => <Input {...p} disabled={ro} value={form.signatureUrl} onChange={text("signatureUrl")} />}</Field>
          </div>
        </section>
        <section className="flex flex-col gap-3">
          <h2 className="text-[14px] font-semibold">{t.quoteSettings.defaults}</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t.quoteSettings.numberPrefix} hint={t.quoteSettings.numberHint(form.numberPrefix || "BG")}>{(p) => <Input {...p} disabled={ro} maxLength={16} value={form.numberPrefix} onChange={text("numberPrefix")} />}</Field>
            <Field label={t.quoteSettings.defaultCurrency}>{(p) => <CurrencySelect {...p} disabled={ro} value={form.defaultCurrency} onChange={(c) => set("defaultCurrency", c)} />}</Field>
            <Field label={t.quoteSettings.defaultVat}>{(p) => <Input {...p} disabled={ro} type="number" min={0} max={100} step="0.01" value={form.defaultVatRate} onChange={(e) => set("defaultVatRate", Number(e.target.value))} />}</Field>
            <Field label={t.quoteSettings.defaultValidDays}>{(p) => <Input {...p} disabled={ro} type="number" min={0} max={3650} value={form.defaultValidDays} onChange={(e) => set("defaultValidDays", Number(e.target.value))} />}</Field>
            <Field label={t.quoteSettings.defaultTerms} className="col-span-2">{(p) => <Textarea {...p} disabled={ro} rows={4} value={form.defaultTerms} onChange={text("defaultTerms")} />}</Field>
          </div>
        </section>
        {isManager && (
          <div>
            <Button variant="primary" loading={save.isPending} onClick={() => save.mutate(form, { onSuccess: () => toast.success(t.quoteSettings.saved), onError: (e) => toast.error(e) })}>
              {t.common.save}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
