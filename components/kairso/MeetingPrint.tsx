"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import type { MeetingItem, TaskResponse } from "@/lib/api/schema";
import { SECTION_META, SECTION_ORDER, itemAssignment, meetingLead, sectionTitle, toDateInput } from "@/lib/domain/meeting";
import { fmtDate } from "@/lib/domain/format";
import { useLinkedTasks, useMeeting } from "@/lib/hooks/meetings";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";

export function MeetingPrint({ id }: { id: string }) {
  const sp = useSearchParams();
  const auto = sp.get("auto") === "1";
  const q = useMeeting(id);
  const { workspaces } = useWorkspace();
  const m = q.data;
  const taskIds = useMemo(() => [...new Set((m?.items ?? []).flatMap((i) => (i.tasks ?? []).map((t) => t.id)))], [m]);
  const linked = useLinkedTasks(taskIds);
  const ws = workspaces.find((w) => w.id === m?.workspaceId);
  const ready = !!m && !linked.isLoading;

  useEffect(() => {
    if (m) document.title = `Bien-ban-hop-${toDateInput(m.meetingDate).split("-").reverse().join("-")}`;
  }, [m]);

  const printed = useRef(false);
  useEffect(() => {
    if (!auto || !ready || printed.current) return;
    printed.current = true;
    const t = setTimeout(() => document.fonts.ready.then(() => window.print()), 300);
    return () => clearTimeout(t);
  }, [auto, ready]);

  if (q.isLoading) return <Center>Đang tải biên bản…</Center>;
  if (!m) return <Center>Không mở được biên bản họp.</Center>;

  const sections = SECTION_ORDER.map((s) => ({ s, rows: m.items.filter((i) => i.section === s), note: m.sectionNotes?.[s] ?? "" })).filter((x) => x.rows.length || x.note);
  const lead = meetingLead(m);

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
        <span className="mr-auto text-[12.5px] text-(--doc-muted)">Chọn “Lưu dưới dạng PDF” trong hộp thoại in.</span>
        <button type="button" onClick={() => window.print()} className="h-ctl rounded-md bg-(--doc-brand) px-4 text-[13px] font-medium text-white">
          In / Lưu PDF
        </button>
      </div>

      <article className="doc mx-auto w-[210mm] max-w-full bg-(--doc-paper) font-sans text-(--doc-ink) shadow-overlay print:shadow-none">
        <header className="flex items-start gap-6 px-[16mm] pb-[9mm] pt-[11mm] text-white" style={{ background: "linear-gradient(90deg, var(--doc-brand), var(--doc-brand-2))" }}>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] opacity-90">Biên bản họp</p>
            <h1 className="mt-2 text-[27px] font-bold leading-tight">{m.title}</h1>
          </div>
          <div className="grid size-[19mm] shrink-0 place-items-center overflow-hidden rounded-xl bg-(--doc-paper)">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ws?.avatar || "/icon-192.png"} alt={ws?.name ?? "Logo"} className="size-[14mm] object-contain" />
          </div>
        </header>

        <div className="flex flex-col gap-[7mm] px-[16mm] pb-[14mm] pt-[7mm]">
          <div className="keep overflow-hidden rounded-lg border border-(--doc-tint-line) bg-(--doc-tint)">
            <div className="grid grid-cols-[1fr_1.6fr_1.2fr] divide-x divide-(--doc-tint-line)">
              <InfoCard label="Thời gian" value={fmtDate(m.meetingDate)} />
              <InfoCard label="Địa điểm / hình thức" value={m.location} />
              <InfoCard label="Người ghi biên bản" value={(m.recorders ?? []).map((p) => p.name).join(", ")} />
            </div>
            <div className="border-t border-(--doc-tint-line)">
              <InfoCard label="Thành phần tham dự" value={(m.attendees ?? []).map((p) => p.name).join(", ")} />
            </div>
          </div>

          {(lead || m.summary) && (
            <Section n={1} title="Thông tin chung">
              {lead && <p className="text-[13px] leading-relaxed text-(--doc-ink-2)">{lead}</p>}
              {m.summary && (
                <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-(--doc-ink-2)">
                  <b className="text-(--doc-ink)">Nội dung:</b> {m.summary}
                </p>
              )}
            </Section>
          )}

          {sections.map(({ s, rows, note }, i) => (
            <Section key={s} n={i + (lead || m.summary ? 2 : 1)} title={sectionTitle(s, rows)}>
              {rows.length > 0 && <ItemsTable section={s} rows={rows} tasks={linked.map} />}
              {note && (
                <p className="keep mt-3 whitespace-pre-line rounded-md border border-(--doc-tint-line) border-l-4 border-l-(--doc-brand) bg-(--doc-tint) px-4 py-3 text-[13px] text-(--doc-ink-2)">
                  <b className="text-(--doc-ink)">Ghi chú:</b> {note}
                </p>
              )}
            </Section>
          ))}
        </div>
      </article>
    </div>
  );
}

function Center({ children }: { children: ReactNode }) {
  return <div className="grid min-h-screen place-items-center text-[13px] text-ink-muted">{children}</div>;
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3.5 py-2.5">
      <p className="text-[9.5px] font-semibold uppercase tracking-wide text-(--doc-brand)">{label}</p>
      <p className="mt-1 text-[13px] leading-snug text-(--doc-ink)">{value || "—"}</p>
    </div>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="keep mb-3 flex items-center gap-3 text-[17px] font-semibold text-(--doc-ink)" style={{ breakAfter: "avoid" }}>
        <span className="grid size-7 place-items-center rounded-full bg-(--doc-brand) text-[13px] font-semibold text-white">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function ItemsTable({ section, rows, tasks }: { section: MeetingItem["section"]; rows: MeetingItem[]; tasks: Map<string, TaskResponse> }) {
  const meta = SECTION_META[section];
  const showStatus = !!meta.status && rows.some((r) => r.status === "done");
  const assign = new Map(rows.map((r) => [r.id, itemAssignment((r.tasks ?? []).map((t) => tasks.get(t.id)))]));
  const showOwner = meta.tasks && [...assign.values()].some((a) => a.owners.length);
  const showDue = meta.tasks && [...assign.values()].some((a) => a.due);
  const showPriority = meta.tasks;

  return (
    <table className="w-full border-separate border-spacing-0 overflow-hidden rounded-lg border border-(--doc-line) text-[13px]">
      <thead>
        <tr className="bg-(--doc-brand) text-left text-[10.5px] font-semibold uppercase tracking-wide text-white">
          <th className="w-[13mm] px-4 py-3">STT</th>
          <th className="w-[34mm] px-3 py-3">Phân hệ</th>
          <th className="px-3 py-3">{meta.contentLabel}</th>
          {showOwner && <th className="w-[30mm] px-3 py-3">Phụ trách</th>}
          {showDue && <th className="w-[24mm] px-3 py-3">Hạn</th>}
          {showStatus && <th className="w-[28mm] px-3 py-3">Trạng thái</th>}
          {showPriority && <th className="w-[22mm] px-3 py-3">Ưu tiên</th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => {
          const a = assign.get(r.id)!;
          const codes = (r.tasks ?? []).map((t) => tasks.get(t.id)?.code ?? t.code);
          return (
            <tr key={r.id} className={i % 2 === 0 ? "bg-(--doc-row-alt)" : "bg-(--doc-paper)"}>
              <Td className="font-semibold text-(--doc-brand)">{i + 1}</Td>
              <Td className="font-semibold">{r.module}</Td>
              <Td>
                <span className="whitespace-pre-line">{r.content}</span>
                {(r.note || codes.length > 0) && (
                  <span className="mt-1 block text-[11.5px] text-(--doc-muted)">
                    {r.note}
                    {r.note && codes.length > 0 && " · "}
                    {codes.length > 0 && <span className="font-mono">{codes.join(", ")}</span>}
                  </span>
                )}
              </Td>
              {showOwner && <Td className="text-[12.5px]">{a.owners.join(", ")}</Td>}
              {showDue && <Td className="whitespace-nowrap text-[12.5px]">{a.due ? fmtDate(a.due) : ""}</Td>}
              {showStatus && <Td className="text-[12.5px]">{meta.status![r.status === "done" ? 1 : 0]}</Td>}
              {showPriority && (
                <Td>
                  {r.priority && <span className="inline-block whitespace-nowrap rounded-full bg-(--doc-brand) px-2.5 py-0.5 text-[11px] font-semibold text-white">Ưu tiên</span>}
                </Td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const Td = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <td className={`border-t border-(--doc-line) px-3 py-3 align-top leading-snug first:px-4 ${className}`}>{children}</td>
);
