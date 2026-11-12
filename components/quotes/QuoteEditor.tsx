"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { QuoteResponse, UpdateQuoteRequest } from "@/lib/api/schema";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { useCurrencies, useCustomers, useQuote, useQuoteMutations } from "@/lib/hooks/quotes";
import { formatMoney, fromMinor, lineTotalMinor, parseDecimal, quoteTotals, toMinor } from "@/lib/domain/money";
import { fmtDateTime } from "@/lib/domain/format";
import { useLocale, useT } from "@/lib/i18n";
import { useToast } from "@/lib/toast/ToastProvider";
import { TopBar, TopBarSpacer } from "@/components/shell/TopBar";
import { Breadcrumb } from "@/components/shell/Breadcrumb";
import { Button, IconButton } from "@/components/ui/Button";
import { Alert, ErrorState, SkeletonRows } from "@/components/ui/feedback";
import { Field, Input, SegmentedControl, Select, Textarea } from "@/components/ui/form";
import { Menu } from "@/components/ui/Popover";
import { useConfirm } from "@/components/ui/Confirm";
import { IconChevronDown, IconChevronUp, IconCopy, IconDownload, IconMore, IconPlus, IconSave, IconSend, IconTrash, IconClose, IconCheck } from "@/components/icons";
import { CurrencySelect, QuoteStatusBadge } from "./shared";
import { CustomerModal } from "./QuotesHome";

type Line = { key: string; name: string; description: string; unit: string; quantity: string; unitPrice: string; discount: string };
type Form = {
  customerId: string;
  title: string;
  currency: string;
  language: string;
  issueDate: string;
  validUntil: string;
  discountType: string;
  discountPercent: string;
  discountAmount: string;
  vatRate: string;
  notes: string;
  terms: string;
  items: Line[];
};

let seq = 0;
const newKey = () => `l${++seq}`;

function toForm(q: QuoteResponse): Form {
  const mu = q.minorUnits;
  return {
    customerId: q.customerId ?? "",
    title: q.title,
    currency: q.currency,
    language: q.language,
    issueDate: q.issueDate,
    validUntil: q.validUntil ?? "",
    discountType: q.discountType,
    discountPercent: String(q.discountPercent || ""),
    discountAmount: q.discountAmount ? String(fromMinor(q.discountAmount, mu)) : "",
    vatRate: String(q.vatRate || ""),
    notes: q.notes,
    terms: q.terms,
    items: q.items.map((it) => ({
      key: newKey(),
      name: it.name,
      description: it.description,
      unit: it.unit,
      quantity: String(it.quantity),
      unitPrice: String(fromMinor(it.unitPrice, mu)),
      discount: it.discountPercent ? String(it.discountPercent) : "",
    })),
  };
}

function toRequest(f: Form, minorUnits: number): UpdateQuoteRequest {
  return {
    customerId: f.customerId || undefined,
    title: f.title,
    currency: f.currency,
    language: f.language,
    issueDate: f.issueDate,
    validUntil: f.validUntil,
    discountType: f.discountType,
    discountPercent: parseDecimal(f.discountPercent),
    discountAmount: toMinor(parseDecimal(f.discountAmount), minorUnits),
    vatRate: parseDecimal(f.vatRate),
    notes: f.notes,
    terms: f.terms,
    items: f.items.map((l) => ({
      name: l.name,
      description: l.description,
      unit: l.unit,
      quantity: parseDecimal(l.quantity),
      unitPrice: toMinor(parseDecimal(l.unitPrice), minorUnits),
      discountPercent: parseDecimal(l.discount),
    })),
  };
}

const strip = (f: Form) => JSON.stringify({ ...f, items: f.items.map(({ key: _k, ...rest }) => rest) });

export function QuoteEditor({ id }: { id: string }) {
  const t = useT();
  const { lang } = useLocale();
  const toast = useToast();
  const confirm = useConfirm();
  const router = useRouter();
  const { workspaceId, isManager } = useWorkspace();
  const q = useQuote(workspaceId, id);
  const customers = useCustomers(workspaceId);
  const currencies = useCurrencies();
  const m = useQuoteMutations(workspaceId);
  const [form, setForm] = useState<Form | null>(null);
  const [base, setBase] = useState("");
  const [addingCustomer, setAddingCustomer] = useState(false);

  useEffect(() => {
    if (!q.data) return;
    const f = toForm(q.data);
    setForm(f);
    setBase(strip(f));
  }, [q.data]);

  const quote = q.data;
  const minorUnits = useMemo(
    () => currencies.data?.find((c) => c.code === form?.currency)?.minorUnits ?? quote?.minorUnits ?? 0,
    [currencies.data, form?.currency, quote?.minorUnits],
  );

  if (q.isLoading || (!form && !q.isError)) return <SkeletonRows rows={10} height={40} />;
  if (q.isError || !quote || !form) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;

  const editable = quote.editable && isManager;
  const dirty = strip(form) !== base;
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));
  const setLine = (key: string, patch: Partial<Line>) => set("items", form.items.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const moveLine = (i: number, d: -1 | 1) => {
    const items = [...form.items];
    [items[i], items[i + d]] = [items[i + d], items[i]];
    set("items", items);
  };

  const lines = form.items.map((l) => lineTotalMinor(parseDecimal(l.quantity), toMinor(parseDecimal(l.unitPrice), minorUnits), parseDecimal(l.discount)));
  const totals = quoteTotals(lines, form.discountType, parseDecimal(form.discountPercent), toMinor(parseDecimal(form.discountAmount), minorUnits), parseDecimal(form.vatRate));
  const money = (v: number) => formatMoney(v, form.currency, minorUnits, lang);

  const save = () =>
    m.update.mutate({ id, body: toRequest(form, minorUnits) }, { onSuccess: () => toast.success(t.quoteEditor.saved), onError: (e) => toast.error(e) });

  const send = async () => {
    if (dirty) return toast.error(t.quoteEditor.sendSaveFirst);
    if (await confirm({ title: t.quoteEditor.sendConfirm, message: t.quoteEditor.sendDesc, confirmLabel: t.quoteEditor.send })) {
      m.send.mutate(id, { onSuccess: () => toast.success(t.quoteEditor.sentOk), onError: (e) => toast.error(e) });
    }
  };
  const setStatus = async (status: string, ask?: string) => {
    if (ask && !(await confirm({ title: ask, danger: true, confirmLabel: t.common.confirm }))) return;
    m.setStatus.mutate({ id, status }, { onSuccess: () => toast.success(t.quoteEditor.statusUpdated), onError: (e) => toast.error(e) });
  };
  const duplicate = () =>
    m.duplicate.mutate(id, { onSuccess: (d) => { toast.success(t.quoteEditor.duplicated); router.push(`/quotes/${d.id}`); }, onError: (e) => toast.error(e) });
  const remove = async () => {
    if (await confirm({ title: t.quoteEditor.removeConfirm(quote.number), danger: true })) {
      m.remove.mutate(id, { onSuccess: () => { toast.success(t.quoteEditor.removed); router.push("/quotes"); }, onError: (e) => toast.error(e) });
    }
  };

  const moreItems = [
    { label: t.quoteEditor.duplicate, icon: <IconCopy size={14} />, onSelect: duplicate },
    ...(quote.status === "sent" || quote.status === "expired"
      ? [
          { label: t.quoteEditor.markAccepted, icon: <IconCheck size={14} />, onSelect: () => setStatus("accepted") },
          { label: t.quoteEditor.markRejected, icon: <IconClose size={14} />, onSelect: () => setStatus("rejected") },
        ]
      : []),
    ...(quote.status === "draft" || quote.status === "sent" || quote.status === "expired"
      ? [{ label: t.quoteEditor.cancelQuote, icon: <IconClose size={14} />, danger: true, separated: true, onSelect: () => setStatus("cancelled", t.quoteEditor.cancelConfirm) }]
      : []),
    ...(quote.status === "draft" ? [{ label: t.quoteEditor.remove, icon: <IconTrash size={14} />, danger: true, onSelect: remove }] : []),
  ];

  return (
    <>
      <TopBar>
        <Breadcrumb items={[{ label: t.quoteEditor.back, href: "/quotes" }, { label: quote.number }]} />
        <QuoteStatusBadge status={quote.status} />
        {editable && dirty && <span className="text-[12px] text-warning">{t.quoteEditor.unsaved}</span>}
        <TopBarSpacer />
        <Button size="sm" variant="ghost" onClick={() => window.open(`/print/quotes/${id}?auto=1`, "_blank")}>
          <IconDownload size={13} /> {t.quoteEditor.print}
        </Button>
        {editable && (
          <>
            <Button size="sm" disabled={!dirty} loading={m.update.isPending} onClick={save}><IconSave size={13} /> {t.quoteEditor.save}</Button>
            <Button size="sm" variant="primary" loading={m.send.isPending} onClick={send}><IconSend size={13} /> {t.quoteEditor.send}</Button>
          </>
        )}
        {isManager && (
          <Menu
            align="end"
            trigger={({ ref, open: _o, ...p }) => (
              <IconButton ref={ref} label={t.quoteEditor.actions} variant="ghost" size="sm" {...p}><IconMore size={14} /></IconButton>
            )}
            items={moreItems}
          />
        )}
      </TopBar>

      <div className="min-h-0 flex-1 overflow-auto bg-surface-sunken">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 p-4 md:p-6">
          {!quote.editable && <Alert>{t.quoteEditor.locked}</Alert>}
          {quote.editable && !isManager && <Alert>{t.quoteEditor.readOnly}</Alert>}
          {editable && !quote.issuer.name && <Alert tone="warning">{t.quoteEditor.issuerMissing}</Alert>}

          <section className="rounded-lg border border-line bg-surface p-4">
            <h2 className="mb-3 text-[13px] font-semibold">{t.quoteEditor.info}</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <Field label={t.quoteEditor.titleLabel} className="md:col-span-2">{(p) => <Input {...p} disabled={!editable} value={form.title} onChange={(e) => set("title", e.target.value)} />}</Field>
              <Field label={t.quoteEditor.project}>{(p) => <Input {...p} disabled value={quote.projectName} />}</Field>
              <Field label={t.quoteEditor.module}>{(p) => <Input {...p} disabled value={quote.moduleName} />}</Field>
              <Field label={t.quoteEditor.customer} className="md:col-span-2">
                {(p) => (
                  <div className="flex gap-2">
                    {editable ? (
                      <Select {...p} value={form.customerId} onChange={(e) => set("customerId", e.target.value)}>
                        <option value="">{t.quoteEditor.noCustomer}</option>
                        {(customers.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </Select>
                    ) : (
                      <Input {...p} disabled value={quote.customer.name || "—"} />
                    )}
                    {editable && (
                      <IconButton label={t.quoteEditor.newCustomer} onClick={() => setAddingCustomer(true)}><IconPlus size={14} /></IconButton>
                    )}
                  </div>
                )}
              </Field>
              <Field label={t.quoteEditor.currency}>{(p) => <CurrencySelect {...p} disabled={!editable} value={form.currency} onChange={(c) => set("currency", c)} />}</Field>
              <Field label={t.quoteEditor.language}>
                {(p) => (
                  <Select {...p} disabled={!editable} value={form.language} onChange={(e) => set("language", e.target.value)}>
                    <option value="vi">{t.quoteEditor.langVi}</option>
                    <option value="en">{t.quoteEditor.langEn}</option>
                  </Select>
                )}
              </Field>
              <Field label={t.quoteEditor.issueDate}>{(p) => <Input {...p} type="date" disabled={!editable} value={form.issueDate} onChange={(e) => set("issueDate", e.target.value)} />}</Field>
              <Field label={t.quoteEditor.validUntil}>{(p) => <Input {...p} type="date" disabled={!editable} value={form.validUntil} onChange={(e) => set("validUntil", e.target.value)} />}</Field>
            </div>
          </section>

          <section className="rounded-lg border border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <h2 className="text-[13px] font-semibold">{t.quoteEditor.items}</h2>
              {editable && (
                <Button size="sm" onClick={() => set("items", [...form.items, { key: newKey(), name: "", description: "", unit: "", quantity: "1", unitPrice: "", discount: "" }])}>
                  <IconPlus size={13} /> {t.quoteEditor.addItem}
                </Button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-[13px]">
                <thead className="bg-surface-sunken text-left text-[11px] font-medium uppercase tracking-wide text-ink-faint">
                  <tr className="h-thead border-b border-line">
                    <th className="w-10 px-3 text-right">#</th>
                    <th className="px-2">{t.quoteEditor.itemName}</th>
                    <th className="w-20 px-2">{t.quoteEditor.unit}</th>
                    <th className="w-24 px-2 text-right">{t.quoteEditor.qty}</th>
                    <th className="w-36 px-2 text-right">{t.quoteEditor.unitPrice}</th>
                    <th className="w-20 px-2 text-right">{t.quoteEditor.discountPct}</th>
                    <th className="w-36 px-2 text-right">{t.quoteEditor.amount}</th>
                    {editable && <th className="w-24 px-2"><span className="sr-only">{t.quoteEditor.actions}</span></th>}
                  </tr>
                </thead>
                <tbody>
                  {form.items.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-6 text-center text-ink-faint">{t.quoteEditor.noItems}</td></tr>
                  )}
                  {form.items.map((l, i) => (
                    <tr key={l.key} className="border-b border-line-row align-top">
                      <td className="px-3 pt-3 text-right font-mono text-[12px] text-ink-faint">{i + 1}</td>
                      <td className="px-2 py-1.5">
                        <div className="flex flex-col gap-1">
                          <Input small aria-label={t.quoteEditor.itemName} placeholder={t.quoteEditor.itemNamePlaceholder} disabled={!editable} value={l.name} onChange={(e) => setLine(l.key, { name: e.target.value })} />
                          <Input small aria-label={t.quoteEditor.descriptionPlaceholder} placeholder={t.quoteEditor.descriptionPlaceholder} disabled={!editable} value={l.description} onChange={(e) => setLine(l.key, { description: e.target.value })} className="text-ink-2" />
                        </div>
                      </td>
                      <td className="px-2 py-1.5"><Input small aria-label={t.quoteEditor.unit} disabled={!editable} value={l.unit} onChange={(e) => setLine(l.key, { unit: e.target.value })} /></td>
                      <td className="px-2 py-1.5"><Input small aria-label={t.quoteEditor.qty} inputMode="decimal" disabled={!editable} value={l.quantity} onChange={(e) => setLine(l.key, { quantity: e.target.value })} className="text-right font-mono" /></td>
                      <td className="px-2 py-1.5"><Input small aria-label={t.quoteEditor.unitPrice} inputMode="decimal" disabled={!editable} value={l.unitPrice} onChange={(e) => setLine(l.key, { unitPrice: e.target.value })} className="text-right font-mono" /></td>
                      <td className="px-2 py-1.5"><Input small aria-label={t.quoteEditor.discountPct} inputMode="decimal" disabled={!editable} value={l.discount} onChange={(e) => setLine(l.key, { discount: e.target.value })} className="text-right font-mono" /></td>
                      <td className="px-2 pt-3 text-right font-mono text-[12px]">{money(lines[i])}</td>
                      {editable && (
                        <td className="px-2 py-1.5">
                          <div className="flex items-center justify-end gap-0.5">
                            <IconButton label={t.quoteEditor.moveUp} variant="ghost" size="sm" disabled={i === 0} onClick={() => moveLine(i, -1)}><IconChevronUp size={13} /></IconButton>
                            <IconButton label={t.quoteEditor.moveDown} variant="ghost" size="sm" disabled={i === form.items.length - 1} onClick={() => moveLine(i, 1)}><IconChevronDown size={13} /></IconButton>
                            <IconButton label={t.quoteEditor.removeItem} variant="ghost" size="sm" onClick={() => set("items", form.items.filter((x) => x.key !== l.key))}><IconTrash size={13} /></IconButton>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 gap-4 border-t border-line p-4 md:grid-cols-[1fr_340px]">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-end gap-3">
                  <SegmentedControl
                    label={t.quoteEditor.discount}
                    size="sm"
                    value={form.discountType as "percent" | "amount"}
                    onChange={(v) => editable && set("discountType", v)}
                    options={[{ value: "percent", label: t.quoteEditor.discountPercent }, { value: "amount", label: t.quoteEditor.discountAmount }]}
                  />
                  {form.discountType === "amount" ? (
                    <Field label={t.quoteEditor.discount} className="w-40">{(p) => <Input {...p} small inputMode="decimal" disabled={!editable} value={form.discountAmount} onChange={(e) => set("discountAmount", e.target.value)} className="text-right font-mono" />}</Field>
                  ) : (
                    <Field label={`${t.quoteEditor.discount} (%)`} className="w-28">{(p) => <Input {...p} small inputMode="decimal" disabled={!editable} value={form.discountPercent} onChange={(e) => set("discountPercent", e.target.value)} className="text-right font-mono" />}</Field>
                  )}
                  <Field label={t.quoteEditor.vat} className="w-28">{(p) => <Input {...p} small inputMode="decimal" disabled={!editable} value={form.vatRate} onChange={(e) => set("vatRate", e.target.value)} className="text-right font-mono" />}</Field>
                </div>
                <Field label={t.quoteEditor.notes}>{(p) => <Textarea {...p} rows={3} disabled={!editable} value={form.notes} onChange={(e) => set("notes", e.target.value)} />}</Field>
                <Field label={t.quoteEditor.terms}>{(p) => <Textarea {...p} rows={4} disabled={!editable} value={form.terms} onChange={(e) => set("terms", e.target.value)} />}</Field>
              </div>
              <dl className="flex h-fit flex-col gap-2 rounded-lg border border-line bg-surface-sunken p-4 text-[13px]">
                <Row label={t.quoteEditor.subtotal} value={money(totals.subtotal)} />
                <Row label={t.quoteEditor.discountTotal} value={totals.discount ? `− ${money(totals.discount)}` : money(0)} />
                <Row label={`${t.quoteEditor.tax}${parseDecimal(form.vatRate) ? ` (${parseDecimal(form.vatRate)}%)` : ""}`} value={money(totals.tax)} />
                <div className="my-1 h-px bg-line" />
                <Row label={t.quoteEditor.grand} value={money(totals.grand)} strong />
                <p className="text-[12px] italic text-ink-2">
                  {t.quoteEditor.inWords}: {dirty ? t.quoteEditor.inWordsAfterSave : quote.amountInWords}
                </p>
              </dl>
            </div>
          </section>

          {quote.events.length > 0 && (
            <section className="rounded-lg border border-line bg-surface p-4">
              <h2 className="mb-2 text-[13px] font-semibold">{t.quoteEditor.history}</h2>
              <ul className="flex flex-col gap-1.5 text-[12.5px] text-ink-2">
                {quote.events.map((e, i) => (
                  <li key={i}>
                    <span className="text-ink-faint">{fmtDateTime(e.createdAt)}</span> · <b className="font-medium text-ink">{e.actorName || "—"}</b>{" "}
                    {t.quoteEditor.event[e.type] ?? e.type}
                    {e.note.startsWith("duplicated:") && ` (${t.quoteEditor.duplicatedFrom(e.note.slice("duplicated:".length))})`}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {addingCustomer && <CustomerModal customer={null} onClose={() => setAddingCustomer(false)} onSaved={(c) => set("customerId", c.id)} />}
    </>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className={strong ? "font-semibold" : "text-ink-2"}>{label}</dt>
      <dd className={`font-mono ${strong ? "text-[15px] font-semibold" : "text-[12.5px]"}`}>{value}</dd>
    </div>
  );
}
