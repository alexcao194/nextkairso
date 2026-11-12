"use client";

import Link from "next/link";
import { tr } from "@/lib/i18n";
import { IconHome } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
      <span className="font-mono text-[13px] font-semibold tracking-wide text-ink-faint">{tr().errors.code404}</span>
      <h1 className="text-[22px] font-semibold text-ink">{tr().errors.notFoundTitle}</h1>
      <p className="max-w-[380px] text-[14px] text-ink-muted">
        {tr().errors.notFoundDesc}
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex h-ctl items-center gap-2 rounded-md bg-(image:--accent-grad) px-4 text-[13px] font-medium text-accent-on shadow-accent hover:brightness-105"
      >
        <IconHome size={15} /> {tr().errors.goHome}
      </Link>
    </div>
  );
}
