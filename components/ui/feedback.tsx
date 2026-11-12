import type { ReactNode } from "react";
import { IconAlert } from "@/components/icons";
import { Button } from "./Button";
import { hueVars, type Hue } from "@/lib/domain/hue";
import { tr } from "@/lib/i18n";

export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      className="animate-spin"
      role="status"
      aria-label={tr().ui.loading}
    >
      <path d="M21 12a9 9 0 1 1-6.2-8.55" opacity={0.9} />
    </svg>
  );
}

export function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div aria-hidden="true" style={style} className={`animate-pulse rounded-md bg-hover ${className}`} />;
}

export function SkeletonRows({ rows = 6, height = 36 }: { rows?: number; height?: number }) {
  return (
    <div role="status" aria-label={tr().ui.loading}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} style={{ height }} className="flex items-center border-b border-line-row px-4">
          <Skeleton className="h-3 w-full max-w-[520px]" style={{ opacity: 1 - i * 0.1 }} />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  hue = "violet",
  className = "",
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  hue?: Hue;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 px-6 py-14 text-center ${className}`}>
      {icon && (
        <span
          style={hueVars(hue)}
          className="relative mb-1 inline-flex size-16 items-center justify-center rounded-2xl bg-(--hs) text-(--h) ring-8 ring-(--hs)/50"
        >
          {icon}
        </span>
      )}
      <p className="text-[14px] font-semibold text-ink">{title}</p>
      {description && <p className="max-w-[360px] text-[13px] text-ink-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
  className = "",
}: {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  const msg = error instanceof Error ? error.message : tr().ui.loadFailedMsg;
  return (
    <div role="alert" className={`flex flex-col items-center gap-2 px-6 py-14 text-center ${className}`}>
      <span className="text-danger">
        <IconAlert size={20} />
      </span>
      <p className="text-[14px] font-semibold text-ink">{tr().ui.loadFailed}</p>
      <p className="max-w-[420px] text-[13px] text-ink-muted">{msg}</p>
      {onRetry && (
        <Button size="sm" onClick={onRetry} className="mt-1">
          {tr().common.retry}
        </Button>
      )}
    </div>
  );
}

type AlertTone = "info" | "warning" | "danger";
const alertClass: Record<AlertTone, string> = {
  info: "border-accent-border bg-accent-soft text-accent-ink",
  warning: "border-warning-border bg-warning-bg text-warning",
  danger: "border-danger-border bg-danger-bg text-danger",
};

export function Alert({ tone = "info", children, className = "" }: { tone?: AlertTone; children: ReactNode; className?: string }) {
  return (
    <div
      role={tone === "danger" ? "alert" : "note"}
      className={`flex items-start gap-2 rounded-md border px-3 py-2 text-[12.5px] ${alertClass[tone]} ${className}`}
    >
      <IconAlert size={14} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger";
const badgeClass: Record<BadgeTone, string> = {
  neutral: "bg-hover text-ink-muted border-line",
  accent: "bg-accent-soft text-accent-ink border-accent-border",
  success: "bg-success-bg text-success border-transparent",
  warning: "bg-warning-bg text-warning border-warning-border",
  danger: "bg-danger-bg text-danger border-danger-border",
};

export function Badge({ tone = "neutral", children, className = "" }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex h-5 items-center gap-1 whitespace-nowrap rounded-full border px-2 text-[11px] font-medium ${badgeClass[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
