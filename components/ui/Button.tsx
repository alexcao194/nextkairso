import Link from "next/link";
import type { AnchorHTMLAttributes, ComponentProps, ReactNode } from "react";
import { Spinner } from "./feedback";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm";

const variantClass: Record<Variant, string> = {
  primary: "bg-(image:--accent-grad) text-accent-on border-transparent shadow-accent font-medium hover:bg-(image:--accent-grad-hover) hover:brightness-105",
  secondary: "bg-surface text-ink border-line-strong hover:bg-accent-soft hover:border-accent-border hover:text-accent-ink",
  ghost: "bg-transparent text-ink-2 border-transparent hover:bg-hover",
  danger: "bg-surface text-danger border-danger-border hover:bg-danger-bg",
};

const sizeClass: Record<Size, string> = {
  md: "h-ctl px-3.5 text-[13px]",
  sm: "h-ctl-sm px-2.5 text-[12px]",
};

const base =
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border transition-colors disabled:cursor-not-allowed disabled:border-line disabled:bg-hover disabled:text-ink-disabled";

export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  loading = false,
  disabled,
  children,
  ...rest
}: ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${base} ${variantClass[variant]} ${sizeClass[size]} ${className}`}
      {...rest}
    >
      {loading && <Spinner size={13} />}
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  variant = "secondary",
  size = "md",
  className = "",
  children,
  ...rest
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${base} ${variantClass[variant]} ${sizeClass[size]} ${className}`} {...rest}>
      {children}
    </Link>
  );
}

export function IconButton({
  label,
  variant = "secondary",
  size = "md",
  className = "",
  children,
  ...rest
}: ComponentProps<"button"> & {
  label: string;
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex shrink-0 items-center justify-center rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        variant === "secondary" ? "text-ink-2" : ""
      } ${variantClass[variant]} ${size === "md" ? "size-ctl" : "size-ctl-sm"} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
