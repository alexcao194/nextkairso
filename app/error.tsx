"use client";

import { useEffect } from "react";
import { IconAlert, IconArrowLeft } from "@/components/icons";
import { tr } from "@/lib/i18n";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-danger-bg text-danger">
        <IconAlert size={22} />
      </span>
      <h1 className="text-[22px] font-semibold text-ink">{tr().errors.errorTitle}</h1>
      <p className="max-w-[380px] text-[14px] text-ink-muted">
        {tr().errors.errorDesc}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-2 inline-flex h-ctl items-center gap-2 rounded-md bg-(image:--accent-grad) px-4 text-[13px] font-medium text-accent-on shadow-accent hover:brightness-105"
      >
        <IconArrowLeft size={15} /> {tr().errors.retry}
      </button>
    </div>
  );
}
