"use client";

import { useId, useMemo, useState } from "react";
import type { MeetingParticipant } from "@/lib/api/schema";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { Avatar } from "@/components/ui/Avatar";
import { IconClose, IconPlus, IconUsers } from "@/components/icons";
import { tr } from "@/lib/i18n";

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().trim();

interface Option {
  key: string;
  value: MeetingParticipant;
  hint: string;
  avatar?: string;
}

const keyOf = (p: MeetingParticipant) => (p.userId ? `u:${p.userId}` : `g:${fold(p.name)}`);

export function ParticipantPicker({
  label,
  value,
  onChange,
  groups = [],
  placeholder = tr().participants.placeholder,
}: {
  label: string;
  value: MeetingParticipant[];
  onChange: (v: MeetingParticipant[]) => void;
  groups?: string[];
  placeholder?: string;
}) {
  const id = useId();
  const { members, projects, workspace } = useWorkspace();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  const all = useMemo<Option[]>(() => {
    const out: Option[] = members.map((m) => ({ key: `u:${m.userId}`, value: { kind: "user", userId: m.userId, name: m.userName }, hint: `@${m.userAlias}`, avatar: m.userAvatar ?? undefined }));
    const seen = new Set<string>();
    const group = (name: string, hint: string) => {
      const k = `g:${fold(name)}`;
      if (!name.trim() || seen.has(k)) return;
      seen.add(k);
      out.push({ key: k, value: { kind: "group", name: name.trim() }, hint });
    };
    if (workspace) group(workspace.name, "Workspace");
    for (const p of projects) group(p.name, tr().participants.project);
    for (const g of groups) group(g, tr().participants.used);
    return out;
  }, [members, projects, workspace, groups]);

  const chosen = new Set(value.map(keyOf));
  const fq = fold(q);
  const options = all.filter((o) => !chosen.has(o.key) && (!fq || fold(`${o.value.name} ${o.hint}`).includes(fq))).slice(0, 8);
  const exact = all.some((o) => fold(o.value.name) === fq) || value.some((v) => fold(v.name) === fq);
  const canAddFree = !!fq && !exact;
  const count = options.length + (canAddFree ? 1 : 0);

  const add = (p: MeetingParticipant) => {
    if (!chosen.has(keyOf(p))) onChange([...value, p]);
    setQ("");
    setActive(0);
  };
  const move = (from: number, to: number) => {
    if (from === to) return;
    const next = [...value];
    const [p] = next.splice(from, 1);
    next.splice(to, 0, p);
    onChange(next);
  };
  const pick = (i: number) => {
    if (i < options.length) add(options[i].value);
    else if (canAddFree) add({ kind: "group", name: q.trim() });
  };

  return (
    <div className="relative flex flex-col gap-1">
      <label htmlFor={id} className="text-[12px] font-medium text-ink-2">{label}</label>
      <div className="flex min-h-ctl flex-wrap items-center gap-1 rounded-md border border-line-strong bg-surface px-1.5 py-1 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
        {value.map((p, i) => (
          <span
            key={keyOf(p)}
            draggable
            title={tr().participants.drag}
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = "move";
              setDrag(i);
            }}
            onDragOver={(e) => {
              if (drag === null) return;
              e.preventDefault();
              setOver(i);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (drag !== null) move(drag, i);
              setDrag(null);
              setOver(null);
            }}
            onDragEnd={() => (setDrag(null), setOver(null))}
            className={`inline-flex h-6 cursor-grab items-center gap-1 rounded-md bg-hover pl-1 pr-0.5 text-[12px] text-ink active:cursor-grabbing ${drag === i ? "opacity-40" : ""} ${over === i && drag !== null && drag !== i ? "ring-1 ring-accent" : ""}`}
          >
            {p.userId ? <Avatar person={{ name: p.name, avatar: members.find((m) => m.userId === p.userId)?.userAvatar }} size="xs" /> : <IconUsers size={12} className="text-ink-faint" />}
            {p.name}
            <button type="button" aria-label={tr().participants.remove(p.name)} onClick={() => onChange(value.filter((v) => keyOf(v) !== keyOf(p)))} className="grid size-4 place-items-center rounded text-ink-faint hover:text-danger">
              <IconClose size={10} />
            </button>
          </span>
        ))}
        <input
          id={id}
          role="combobox"
          aria-expanded={open && count > 0}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            if (q.trim()) {
              const match = options.find((o) => fold(o.value.name) === fq);
              if (match) add(match.value);
              else if (canAddFree) add({ kind: "group", name: q.trim() });
              else setQ("");
            }
            setOpen(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") (e.preventDefault(), setActive((a) => Math.min(a + 1, count - 1)));
            else if (e.key === "ArrowUp") (e.preventDefault(), setActive((a) => Math.max(a - 1, 0)));
            else if ((e.key === "Enter" || e.key === ",") && q.trim()) (e.preventDefault(), e.stopPropagation(), pick(active));
            else if (e.key === "Escape" && open) (e.stopPropagation(), e.preventDefault(), setOpen(false));
            else if (e.key === "Backspace" && !q && value.length) onChange(value.slice(0, -1));
          }}
          placeholder={value.length ? "" : placeholder}
          className="h-6 min-w-[120px] flex-1 bg-transparent px-1 text-[13px] text-ink outline-none placeholder:text-ink-placeholder"
        />
      </div>
      {open && count > 0 && (
        <ul id={`${id}-list`} role="listbox" aria-label={label} className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border border-line bg-surface p-1 shadow-overlay">
          {options.map((o, i) => (
            <li
              key={o.key}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => (e.preventDefault(), add(o.value))}
              onMouseEnter={() => setActive(i)}
              className={`flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-[13px] ${i === active ? "bg-hover" : ""}`}
            >
              {o.value.userId ? <Avatar person={{ name: o.value.name, avatar: o.avatar }} size="xs" /> : <IconUsers size={13} className="text-ink-faint" />}
              <span className="truncate">{o.value.name}</span>
              <span className="ml-auto shrink-0 text-[11.5px] text-ink-faint">{o.hint}</span>
            </li>
          ))}
          {canAddFree && (
            <li
              role="option"
              aria-selected={active === options.length}
              onMouseDown={(e) => (e.preventDefault(), pick(options.length))}
              onMouseEnter={() => setActive(options.length)}
              className={`flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-[13px] ${active === options.length ? "bg-hover" : ""}`}
            >
              <IconPlus size={13} className="text-ink-faint" />
              {tr().participants.addName(q.trim())}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
