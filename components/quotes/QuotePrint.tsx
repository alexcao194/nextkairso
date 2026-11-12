"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import type { PartyInfo } from "@/lib/api/schema";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { useQuote } from "@/lib/hooks/quotes";
import { formatMoney, formatNumber } from "@/lib/domain/money";
import { dict } from "@/lib/i18n/dict";
import { dateLocale, tr, type Lang } from "@/lib/i18n";

function fmtDocDate(d: string | undefined, lang: Lang) {
  if (!d) return "—";
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString(dateLocale(lang), { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function QuotePrint({ id }: { id: string }) {
  const sp = useSearchParams();
  const auto = sp.get("auto") === "1";
  const { workspaceId, workspace } = useWorkspace();
  const q = useQuote(workspaceId, id);
  const quote = q.data;

  useEffect(() => {
    if (quote) document.title = quote.number;
  }, [quote]);

  const printed = useRef(false);
  useEffect(() => {
    if (!auto || !quote || printed.current) return;
    printed.current = true;
    const timer = setTimeout(() => document.fonts.ready.then(() => window.print()), 300);
    return () => clearTimeout(timer);
  }, [auto, quote]);

  if (q.isLoading || !workspaceId) return <Center>{tr().quotePrint.loading}</Center>;
  if (!quote) return <Center>{tr().quotePrint.failed}</Center>;

  // The document follows the quote's language, not the viewer's UI language.
  const lang: Lang = quote.language === "en" ? "en" : "vi";
  const p = dict[lang].quotePrint;
  const money = (v: number) => formatMoney(v, quote.currency, quote.minorUnits, lang);
  const issuer = quote.issuer;
  const hasLineDiscount = quote.items.some((it) => it.discountPercent > 0);

  return (
    <div className="min-h-screen bg-(--doc-backdrop) py-8 print:bg-(--doc-paper) print:py-0">
      <style>{`
        @page { size: A4; margin: 12mm 0 12mm; }
        @page :first { margin-top: 0; }
        @media print { html, body { background: var(--doc-paper) !important; } }
        .doc, .doc * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .doc tr, .doc .keep { break-inside: avoid; }
      `}</style>

      <div className="mx-auto mb-4 flex w-[210mm] max-w-full items-center justify-end gap-2 px-2 print:hidden">
        <span className="mr-auto text-[12.5px] text-(--doc-muted)">{tr().quotePrint.hint}</span>
        <button type="button" onClick={() => window.print()} className="h-ctl rounded-md bg-(--doc-brand) px-4 text-[13px] font-medium text-white">
          {tr().quotePrint.printBtn}
        </button>
      </div>

      <article className="doc relative mx-auto w-[210mm] max-w-full overflow-hidden bg-(--doc-paper) font-sans text-(--doc-ink) shadow-overlay print:shadow-none">
        {quote.status === "draft" && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
            <span className="-rotate-30 select-none text-[110px] font-bold tracking-[0.15em] text-(--doc-tint-line) opacity-60">{p.draftMark}</span>
          </div>
        )}

        <header className="flex items-start gap-6 px-[16mm] pb-[8mm] pt-[11mm] text-white" style={{ background: "linear-gradient(90deg, var(--doc-brand), var(--doc-brand-2))" }}>
          <div className="grid size-[18mm] shrink-0 place-items-center overflow-hidden rounded-xl bg-(--doc-paper)">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={issuer.logoUrl || workspace?.avatar || "/icon-192.png"} alt={issuer.name || "Logo"} className="size-[14mm] object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold leading-tight">{issuer.name || workspace?.name}</p>
            <PartyLines party={issuer} p={p} light />
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[24px] font-bold tracking-[0.12em]">{p.docTitle}</p>
            <p className="mt-1 text-[12px] opacity-90">{p.number}: <b className="font-mono">{quote.number}</b></p>
            <p className="text-[12px] opacity-90">{p.date}: {fmtDocDate(quote.issueDate, lang)}</p>
            {quote.validUntil && <p className="text-[12px] opacity-90">{p.validUntil}: {fmtDocDate(quote.validUntil, lang)}</p>}
          </div>
        </header>

        <div className="relative flex flex-col gap-[6mm] px-[16mm] pb-[14mm] pt-[7mm]">
          <div className="keep grid grid-cols-[1.4fr_1fr] gap-4 rounded-lg border border-(--doc-tint-line) bg-(--doc-tint) px-4 py-3">
            <div>
              <p className="text-[9.5px] font-semibold uppercase tracking-wide text-(--doc-brand)">{p.to}</p>
              <p className="mt-1 text-[14px] font-semibold">{quote.customer.name || "—"}</p>
              <PartyLines party={quote.customer} p={p} />
            </div>
            <div className="text-[12.5px]">
              <p className="text-[9.5px] font-semibold uppercase tracking-wide text-(--doc-brand)">{p.project}</p>
              <p className="mt-1 font-medium">{quote.projectName}</p>
              <p className="mt-2 text-[9.5px] font-semibold uppercase tracking-wide text-(--doc-brand)">{p.module}</p>
              <p className="mt-1 font-medium">{quote.moduleName}</p>
            </div>
          </div>

          {quote.title && <h1 className="text-[18px] font-bold leading-snug">{quote.title}</h1>}

          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="bg-(--doc-brand) text-left text-[10.5px] uppercase tracking-wide text-white">
                <th className="w-9 px-2 py-2 text-center">{p.no}</th>
                <th className="px-2 py-2">{p.item}</th>
                <th className="w-14 px-2 py-2">{p.unit}</th>
                <th className="w-14 px-2 py-2 text-right">{p.qty}</th>
                <th className="w-28 px-2 py-2 text-right">{p.unitPrice}</th>
                {hasLineDiscount && <th className="w-12 px-2 py-2 text-right">{p.discount}</th>}
                <th className="w-32 px-2 py-2 text-right">{p.amount}</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.map((it, i) => (
                <tr key={it.id} className="border-b border-(--doc-tint-line) align-top even:bg-(--doc-tint)">
                  <td className="px-2 py-2 text-center text-(--doc-muted)">{i + 1}</td>
                  <td className="px-2 py-2">
                    <p className="font-medium">{it.name}</p>
                    {it.description && <p className="mt-0.5 whitespace-pre-line text-[11px] text-(--doc-ink-2)">{it.description}</p>}
                  </td>
                  <td className="px-2 py-2">{it.unit}</td>
                  <td className="px-2 py-2 text-right font-mono">{formatNumber(it.quantity, 3, lang)}</td>
                  <td className="px-2 py-2 text-right font-mono">{money(it.unitPrice)}</td>
                  {hasLineDiscount && <td className="px-2 py-2 text-right font-mono">{it.discountPercent ? `${formatNumber(it.discountPercent, 2, lang)}%` : ""}</td>}
                  <td className="px-2 py-2 text-right font-mono">{money(it.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="keep flex justify-end">
            <dl className="w-[85mm] text-[12.5px]">
              <TotalRow label={p.subtotal} value={money(quote.subtotal)} />
              {quote.discountTotal > 0 && (
                <TotalRow label={quote.discountType === "percent" ? `${p.discountTotal} (${formatNumber(quote.discountPercent, 2, lang)}%)` : p.discountTotal} value={`− ${money(quote.discountTotal)}`} />
              )}
              <TotalRow label={p.vat(formatNumber(quote.vatRate, 2, lang))} value={money(quote.taxTotal)} />
              <div className="mt-1 flex items-baseline justify-between rounded-md bg-(--doc-brand) px-3 py-2 text-white">
                <dt className="text-[13px] font-semibold">{p.grand}</dt>
                <dd className="font-mono text-[15px] font-bold">{money(quote.grandTotal)}</dd>
              </div>
            </dl>
          </div>
          <p className="keep -mt-2 text-[12px] italic text-(--doc-ink-2)">
            <b className="not-italic text-(--doc-ink)">{p.inWords}:</b> {quote.amountInWords}.
          </p>

          {quote.notes && <Block title={p.notes}>{quote.notes}</Block>}
          {quote.terms && <Block title={p.terms}>{quote.terms}</Block>}
          {issuer.bankInfo && <Block title={p.bank}>{issuer.bankInfo}</Block>}

          <div className="keep mt-[6mm] grid grid-cols-2 gap-8 text-center text-[12px]">
            <div>
              <p className="font-semibold">{p.customerSign}</p>
              <p className="text-[11px] italic text-(--doc-muted)">{p.signHint}</p>
              <div className="h-[24mm]" />
            </div>
            <div>
              <p className="font-semibold">{p.issuerSign}</p>
              <p className="text-[11px] italic text-(--doc-muted)">{p.signHint}</p>
              <div className="grid h-[24mm] place-items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {issuer.signatureUrl && <img src={issuer.signatureUrl} alt="" className="max-h-[22mm] object-contain" />}
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

type PrintMessages = (typeof dict)["vi"]["quotePrint"];

function PartyLines({ party, p, light }: { party: PartyInfo; p: PrintMessages; light?: boolean }) {
  const cls = light ? "text-[11px] leading-snug opacity-90" : "text-[12px] leading-snug text-(--doc-ink-2)";
  return (
    <div className={`mt-1 flex flex-col ${cls}`}>
      {party.address && <span>{party.address}</span>}
      {party.taxCode && <span>{p.taxCode}: {party.taxCode}</span>}
      {(party.phone || party.email) && <span>{[party.phone && `${p.tel}: ${party.phone}`, party.email].filter(Boolean).join(" · ")}</span>}
      {party.contactName && <span>{p.contact}: {party.contactName}</span>}
      {party.website && <span>{party.website}</span>}
    </div>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-(--doc-tint-line) px-3 py-1.5">
      <dt className="text-(--doc-ink-2)">{label}</dt>
      <dd className="font-mono">{value}</dd>
    </div>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="keep rounded-md border border-(--doc-tint-line) border-l-4 border-l-(--doc-brand) bg-(--doc-tint) px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-(--doc-brand)">{title}</p>
      <p className="mt-1 whitespace-pre-line text-[12.5px] leading-relaxed text-(--doc-ink-2)">{children}</p>
    </div>
  );
}

function Center({ children }: { children: ReactNode }) {
  return <div className="grid min-h-screen place-items-center text-[13px] text-ink-muted">{children}</div>;
}
