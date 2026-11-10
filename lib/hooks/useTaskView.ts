"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DEFAULT_COLUMNS, parseView, type ColumnKey, type TaskView } from "../domain/taskView";

const COLS_KEY = "kairso-task-columns";

type Params = Partial<Record<"q" | "status" | "priority" | "module" | "worker" | "label" | "group" | "sort" | "archived" | "task", string | null>>;

export function useTaskViewState() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const view: TaskView = useMemo(() => parseView(new URLSearchParams(sp.toString())), [sp]);

  const setParams = useCallback(
    (p: Params) => {
      const next = new URLSearchParams(window.location.search);
      for (const [k, v] of Object.entries(p)) {
        if (v === null || v === undefined || v === "") next.delete(k);
        else next.set(k, v);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  const [columns, setColumnsState] = useState<ColumnKey[]>(DEFAULT_COLUMNS);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(COLS_KEY);
      if (raw) setColumnsState(JSON.parse(raw) as ColumnKey[]);
    } catch {
      /* dùng mặc định */
    }
  }, []);
  const setColumns = useCallback((c: ColumnKey[]) => {
    setColumnsState(c);
    try {
      localStorage.setItem(COLS_KEY, JSON.stringify(c));
    } catch {
      /* bỏ qua */
    }
  }, []);

  return { view, setParams, columns, setColumns, taskId: sp.get("task") };
}

export const listParam = (l: string[]) => (l.length ? l.join(",") : null);
