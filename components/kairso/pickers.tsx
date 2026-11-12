"use client";

import { useState, type ReactNode } from "react";
import type { ModuleResponse, TaskLabelResponse, TaskStatus } from "@/lib/api/schema";
import { PRIORITY_LEVELS, PRIORITY_META, TASK_STATUSES, priorityLevel, priorityToApi } from "@/lib/domain/task";
import { DEFAULT_LABEL_COLOR, LABEL_COLORS } from "@/lib/domain/label";
import { Popover } from "@/components/ui/Popover";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarGroup, AvatarPlaceholder, type Person } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/form";
import { IconCheck, IconChevronDown, IconPlus } from "@/components/icons";
import { StatusChip } from "./StatusChip";
import { PriorityTag } from "./PriorityTag";
import { LabelChip } from "./LabelChip";
import { tr } from "@/lib/i18n";

function PickerTrigger({
  children,
  disabled,
  bare,
  ...p
}: {
  children: ReactNode;
  disabled?: boolean;
  bare?: boolean;
} & Record<string, unknown>) {
  return (
    <button
      type="button"
      disabled={disabled}
      {...p}
      className={`group/pk inline-flex max-w-full items-center gap-1.5 rounded-md text-left disabled:cursor-default ${
        bare ? "" : "h-ctl-sm border border-line-strong bg-surface px-2 hover:bg-hover"
      }`}
    >
      {children}
      {!disabled && (
        <IconChevronDown size={12} className={`shrink-0 text-ink-faint ${bare ? "opacity-0 group-hover/pk:opacity-100 group-focus-visible/pk:opacity-100" : ""}`} />
      )}
    </button>
  );
}

const OptionRow = ({ selected, onClick, children }: { selected?: boolean; onClick: () => void; children: ReactNode }) => (
  <button
    type="button"
    role="menuitemradio"
    aria-checked={selected}
    onClick={onClick}
    className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-[13px] hover:bg-hover"
  >
    <span className="min-w-0 flex-1">{children}</span>
    {selected && <IconCheck size={14} className="shrink-0 text-accent" />}
  </button>
);

export function StatusPicker({
  value,
  onChange,
  disabled,
  bare,
}: {
  value: TaskStatus;
  onChange: (s: TaskStatus) => void;
  disabled?: boolean;
  bare?: boolean;
}) {
  return (
    <Popover
      role="menu"
      trigger={({ ref, open: _o, ...p }) => (
        <PickerTrigger ref={ref} disabled={disabled} bare={bare} {...p}>
          <StatusChip status={value} />
        </PickerTrigger>
      )}
    >
      {(close) => (
        <div className="w-44">
          {TASK_STATUSES.map((s) => (
            <OptionRow
              key={s}
              selected={s === value}
              onClick={() => {
                close();
                if (s !== value) onChange(s);
              }}
            >
              <StatusChip status={s} size="sm" />
            </OptionRow>
          ))}
        </div>
      )}
    </Popover>
  );
}

export function PriorityPicker({
  value,
  onChange,
  disabled,
  bare,
}: {
  value: number | null | undefined;
  onChange: (apiPriority: number) => void;
  disabled?: boolean;
  bare?: boolean;
}) {
  const cur = priorityLevel(value);
  return (
    <Popover
      role="menu"
      trigger={({ ref, open: _o, ...p }) => (
        <PickerTrigger ref={ref} disabled={disabled} bare={bare} {...p}>
          {cur === null ? <span className="text-[12.5px] text-ink-muted">{tr().pickers.priority}</span> : <PriorityTag priority={value} />}
        </PickerTrigger>
      )}
    >
      {(close) => (
        <div className="w-44">
          {PRIORITY_LEVELS.map((l) => (
            <OptionRow
              key={l}
              selected={l === cur}
              onClick={() => {
                close();
                if (l !== cur) onChange(priorityToApi(l));
              }}
            >
              <span className="inline-flex items-center gap-2">
                <PriorityTag priority={PRIORITY_META[l].api} showLabel={false} />
                <span>{PRIORITY_META[l].label}</span>
              </span>
            </OptionRow>
          ))}
        </div>
      )}
    </Popover>
  );
}

interface PickablePerson extends Person {
  id: string;
  alias?: string;
}

export function PeoplePicker({
  people,
  value,
  onChange,
  title,
  emptyLabel,
  disabled,
  bare,
}: {
  people: PickablePerson[];
  value: Record<string, number>;
  onChange: (next: Record<string, number>) => void;
  title: string;
  emptyLabel: string;
  disabled?: boolean;
  bare?: boolean;
}) {
  const selected = people.filter((p) => p.id in value);
  return (
    <Popover
      trigger={({ ref, open: _o, ...p }) => (
        <PickerTrigger ref={ref} disabled={disabled} bare={bare} {...p}>
          {selected.length === 0 ? (
            <>
              <AvatarPlaceholder />
              <span className="text-[12.5px] text-ink-muted">{emptyLabel}</span>
            </>
          ) : selected.length === 1 ? (
            <>
              <Avatar person={selected[0]} />
              <span className="truncate text-[13px] text-ink">{selected[0].name}</span>
            </>
          ) : (
            <>
              <AvatarGroup people={selected} />
              <span className="text-[12.5px] text-ink-2">{tr().pickers.people(selected.length)}</span>
            </>
          )}
        </PickerTrigger>
      )}
    >
      {(close) => <PeopleEditor title={title} people={people} initial={value} onApply={(v) => { close(); onChange(v); }} onCancel={close} />}
    </Popover>
  );
}

function PeopleEditor({
  title,
  people,
  initial,
  onApply,
  onCancel,
}: {
  title: string;
  people: PickablePerson[];
  initial: Record<string, number>;
  onApply: (v: Record<string, number>) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [q, setQ] = useState("");
  const list = people.filter((p) => `${p.name} ${p.alias ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="w-[300px]">
      <p className="px-2 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-faint">{title}</p>
      <div className="px-1 pb-1.5">
        <Input small placeholder={tr().pickers.searchPeoplePh} aria-label={tr().pickers.searchPeople} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <ul className="max-h-[240px] overflow-y-auto">
        {list.map((p) => {
          const on = p.id in draft;
          return (
            <li key={p.id} className="flex h-9 items-center gap-2 rounded-md px-2 hover:bg-hover">
              <input
                type="checkbox"
                id={`pp-${p.id}`}
                checked={on}
                onChange={() =>
                  setDraft((d) => {
                    const n = { ...d };
                    if (on) delete n[p.id];
                    else n[p.id] = 1;
                    return n;
                  })
                }
                className="size-4 accent-[var(--accent)]"
              />
              <label htmlFor={`pp-${p.id}`} className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
                <Avatar person={p} />
                <span className="truncate text-[13px]">{p.name}</span>
              </label>
              {on && (
                <label className="flex items-center gap-1 text-[11px] text-ink-faint">
                  <span>{tr().pickers.weight}</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={draft[p.id]}
                    onChange={(e) => setDraft((d) => ({ ...d, [p.id]: Math.max(1, Number(e.target.value) || 1) }))}
                    className="h-6 w-12 rounded border border-line-strong bg-surface px-1 text-center font-mono text-[12px] text-ink"
                  />
                </label>
              )}
            </li>
          );
        })}
        {list.length === 0 && <li className="px-2 py-3 text-center text-[12px] text-ink-muted">{tr().pickers.nobody}</li>}
      </ul>
      <div className="flex justify-end gap-1.5 border-t border-line px-1 pb-1 pt-2">
        <Button size="sm" onClick={onCancel}>
          {tr().pickers.cancel}
        </Button>
        <Button size="sm" variant="primary" onClick={() => onApply(draft)}>
          {tr().pickers.apply}
        </Button>
      </div>
    </div>
  );
}

export function LabelPicker({
  labels,
  value,
  onChange,
  onCreate,
  disabled,
  bare,
}: {
  labels: TaskLabelResponse[];
  value: string[];
  onChange: (ids: string[]) => void;
  onCreate?: (name: string, color: string) => Promise<TaskLabelResponse | void>;
  disabled?: boolean;
  bare?: boolean;
}) {
  const selected = labels.filter((l) => value.includes(l.id));
  return (
    <Popover
      trigger={({ ref, open: _o, ...p }) => (
        <PickerTrigger ref={ref} disabled={disabled} bare={bare} {...p}>
          {selected.length === 0 ? (
            <span className="text-[12.5px] text-ink-muted">{tr().pickers.addLabel}</span>
          ) : (
            <span className="flex flex-wrap gap-1">
              {selected.map((l) => (
                <LabelChip key={l.id} name={l.name} color={l.color} />
              ))}
            </span>
          )}
        </PickerTrigger>
      )}
    >
      {(close) => <LabelEditor labels={labels} initial={value} onApply={(v) => { close(); onChange(v); }} onCancel={close} onCreate={onCreate} />}
    </Popover>
  );
}

function LabelEditor({
  labels,
  initial,
  onApply,
  onCancel,
  onCreate,
}: {
  labels: TaskLabelResponse[];
  initial: string[];
  onApply: (v: string[]) => void;
  onCancel: () => void;
  onCreate?: (name: string, color: string) => Promise<TaskLabelResponse | void>;
}) {
  const [draft, setDraft] = useState(new Set(initial));
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(DEFAULT_LABEL_COLOR);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!name.trim() || !onCreate) return;
    setBusy(true);
    try {
      const l = await onCreate(name.trim(), color);
      if (l) setDraft((d) => new Set(d).add(l.id));
      setName("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-[280px]">
      <ul className="max-h-[200px] overflow-y-auto">
        {labels.map((l) => (
          <li key={l.id}>
            <label className="flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 hover:bg-hover">
              <input
                type="checkbox"
                checked={draft.has(l.id)}
                onChange={() =>
                  setDraft((d) => {
                    const n = new Set(d);
                    if (n.has(l.id)) n.delete(l.id);
                    else n.add(l.id);
                    return n;
                  })
                }
                className="size-4 accent-[var(--accent)]"
              />
              <LabelChip name={l.name} color={l.color} />
            </label>
          </li>
        ))}
        {labels.length === 0 && <li className="px-2 py-3 text-center text-[12px] text-ink-muted">{tr().pickers.noLabels}</li>}
      </ul>
      {onCreate && (
        <div className="mt-1 flex flex-col gap-1.5 border-t border-line px-1 pt-2">
          <div className="flex items-center gap-1.5">
            <Input
              small
              placeholder={tr().pickers.newLabelPh}
              aria-label={tr().pickers.newLabel}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), create())}
            />
            <Button size="sm" onClick={create} loading={busy} disabled={!name.trim()} aria-label={tr().pickers.createLabel}>
              <IconPlus size={13} />
            </Button>
          </div>
          <div className="flex gap-1" role="radiogroup" aria-label={tr().pickers.labelColor}>
            {LABEL_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={c === color}
                aria-label={tr().pickers.color(c)}
                onClick={() => setColor(c)}
                className={`size-5 rounded-full ${c === color ? "ring-2 ring-accent ring-offset-2 ring-offset-surface" : ""}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      )}
      <div className="mt-2 flex justify-end gap-1.5 border-t border-line px-1 pb-1 pt-2">
        <Button size="sm" onClick={onCancel}>
          {tr().pickers.cancel}
        </Button>
        <Button size="sm" variant="primary" onClick={() => onApply([...draft])}>
          {tr().pickers.apply}
        </Button>
      </div>
    </div>
  );
}

export function ModulePicker({
  modules,
  value,
  onChange,
  disabled,
  bare,
}: {
  modules: ModuleResponse[];
  value?: string;
  onChange: (id: string | null) => void;
  disabled?: boolean;
  bare?: boolean;
}) {
  const cur = modules.find((m) => m.id === value);
  return (
    <Popover
      role="menu"
      trigger={({ ref, open: _o, ...p }) => (
        <PickerTrigger ref={ref} disabled={disabled} bare={bare} {...p}>
          <span className={`truncate text-[13px] ${cur ? "text-ink" : "text-ink-muted"}`}>{cur?.name ?? tr().pickers.noModules}</span>
        </PickerTrigger>
      )}
    >
      {(close) => (
        <div className="w-56">
          <OptionRow
            selected={!value}
            onClick={() => {
              close();
              if (value) onChange(null);
            }}
          >
            <span className="text-ink-muted">{tr().pickers.noModule}</span>
          </OptionRow>
          {modules.map((m) => (
            <OptionRow
              key={m.id}
              selected={m.id === value}
              onClick={() => {
                close();
                if (m.id !== value) onChange(m.id);
              }}
            >
              <span className="block truncate">{m.name}</span>
            </OptionRow>
          ))}
        </div>
      )}
    </Popover>
  );
}

export function DateField({
  value,
  onChange,
  label,
  disabled,
  min,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  disabled?: boolean;
  min?: string;
}) {
  return (
    <input
      type="date"
      aria-label={label}
      value={value}
      min={min}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="h-ctl-sm w-[128px] rounded-md border border-line-strong bg-surface px-2 font-mono text-[12px] text-ink outline-none hover:border-ink-disabled focus:border-accent focus:ring-1 focus:ring-accent disabled:bg-hover disabled:text-ink-disabled"
    />
  );
}
