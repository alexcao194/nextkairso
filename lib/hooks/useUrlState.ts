"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useUrlState(key: string, def = ""): [string, (v: string | null) => void] {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const value = sp.get(key) ?? def;

  const set = useCallback(
    (v: string | null) => {
      const next = new URLSearchParams(window.location.search);
      if (v === null || v === "" || v === def) next.delete(key);
      else next.set(key, v);
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [key, def, router, pathname],
  );
  return [value, set];
}
