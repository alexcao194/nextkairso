"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { IconChevronDown, IconSearch, IconClose } from "@/components/icons";

const controlBase =
  "w-full rounded-md border bg-surface text-[13px] text-ink outline-none transition-colors placeholder:text-ink-placeholder hover:border-ink-disabled focus:border-accent focus:ring-1 focus:ring-accent disabled:cursor-not-allowed disabled:bg-hover disabled:text-ink-disabled";
const border = (invalid?: boolean) => (invalid ? "border-danger" : "border-line-strong");

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  children: (p: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode;
  className?: string;
}) {
  const id = useId();
  const note = error || hint;
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="text-[12px] font-medium text-ink-2">
        {label}
        {required && <span className="ml-0.5 text-danger" aria-hidden="true">*</span>}
      </label>
      {children({ id, "aria-invalid": !!error, "aria-describedby": note ? `${id}-note` : undefined })}
      {note && (
        <p id={`${id}-note`} className={`text-[12px] ${error ? "text-danger" : "text-ink-faint"}`}>
          {note}
        </p>
      )}
    </div>
  );
}

export function Input({
  invalid,
  small,
  className = "",
  ...rest
}: ComponentProps<"input"> & { invalid?: boolean; small?: boolean }) {
  return (
    <input
      {...rest}
      className={`${controlBase} ${border(invalid)} ${small ? "h-ctl-sm px-2" : "h-ctl px-2.5"} ${className}`}
    />
  );
}

export function Textarea({
  invalid,
  className = "",
  rows = 3,
  ...rest
}: ComponentProps<"textarea"> & { invalid?: boolean }) {
  return (
    <textarea
      rows={rows}
      {...rest}
      className={`${controlBase} ${border(invalid)} min-h-[64px] resize-y px-2.5 py-1.5 leading-relaxed ${className}`}
    />
  );
}

export function Select({
  invalid,
  small,
  className = "",
  children,
  ...rest
}: ComponentProps<"select"> & { invalid?: boolean; small?: boolean }) {
  return (
    <span className={`relative inline-flex items-center ${className || "w-full"}`}>
      <select
        {...rest}
        className={`${controlBase} ${border(invalid)} ${small ? "h-ctl-sm pl-2 pr-7" : "h-ctl pl-2.5 pr-8"} appearance-none`}
      >
        {children}
      </select>
      <IconChevronDown size={13} className="pointer-events-none absolute right-2.5 text-ink-faint" />
    </span>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Tìm kiếm…",
  label = "Tìm kiếm",
  className = "",
  kbd,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  kbd?: string;
}) {
  const id = useId();
  return (
    <div
      className={`flex h-ctl-sm items-center gap-2 rounded-md border border-line-strong bg-surface px-2.5 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent ${className}`}
    >
      <IconSearch size={13} className="shrink-0 text-ink-faint" />
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[12px] text-ink outline-none placeholder:text-ink-placeholder [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button type="button" aria-label="Xoá tìm kiếm" onClick={() => onChange("")} className="text-ink-faint hover:text-ink">
          <IconClose size={12} />
        </button>
      ) : (
        kbd && <kbd className="font-mono text-[10px] text-ink-placeholder">{kbd}</kbd>
      )}
    </div>
  );
}

export function Checkbox({
  label,
  className = "",
  ...rest
}: Omit<ComponentProps<"input">, "type"> & { label: ReactNode }) {
  const id = useId();
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <input id={id} type="checkbox" {...rest} className="size-4 shrink-0 cursor-pointer accent-[var(--accent)]" />
      <label htmlFor={id} className="cursor-pointer text-[13px] text-ink">
        {label}
      </label>
    </span>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "border-accent bg-accent" : "border-line-strong bg-hover"
      }`}
    >
      <span
        className={`absolute top-1/2 size-3.5 -translate-y-1/2 rounded-full bg-white shadow-sm transition-[left] ${
          checked ? "left-[19px]" : "left-[2px]"
        }`}
      />
    </button>
  );
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
  label: string;
  size?: "md" | "sm";
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`inline-flex rounded-md border border-line-strong bg-hover p-0.5 ${size === "md" ? "h-ctl" : "h-ctl-sm"}`}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded px-3 text-[12.5px] transition-colors ${
            value === o.value ? "bg-surface font-medium text-ink shadow-sm" : "text-ink-muted hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
