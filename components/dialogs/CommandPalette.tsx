"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getWorkspaceProjectTasks } from "@/lib/api/endpoints";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { projectColor } from "@/lib/domain/format";
import { Modal } from "@/components/ui/Modal";
import { StatusChip } from "@/components/kairso/StatusChip";
import { useDialogs } from "./DialogProvider";

interface Entry {
  key: string;
  label: string;
  hint?: string;
  section: "Điều hướng" | "Dự án" | "Task" | "Hành động";
  run: () => void;
  extra?: React.ReactNode;
}

const NAV: Array<[string, string]> = [
  ["Tổng quan", "/"],
  ["Hộp thư", "/inbox"],
  ["Task của tôi", "/my-tasks"],
  ["Thảo luận", "/threads"],
  ["Lịch & chấm công", "/calendar"],
  ["Sáng kiến", "/initiatives"],
  ["Phân tích", "/analytics"],
  ["Thành viên & cài đặt", "/settings/members"],
];

function useDebounced<T>(v: T, ms = 250) {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Tìm nhanh" width={560}>
      <Palette onClose={onClose} />
    </Modal>
  );
}

function Palette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { workspaceId, projects } = useWorkspace();
  const { openCreateTask, openCreateProject } = useDialogs();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const dq = useDebounced(q.trim());
  const listRef = useRef<HTMLUListElement>(null);

  const tasks = useQuery({
    queryKey: ["command-tasks", workspaceId, dq],
    enabled: dq.length >= 2 && projects.length > 0,
    queryFn: async () => {
      const per = await Promise.allSettled(
        projects.slice(0, 8).map((p) => getWorkspaceProjectTasks(workspaceId, p.id, { q: dq, limit: 5 })),
      );
      return per.flatMap((r, i) => (r.status === "fulfilled" ? (r.value.items ?? []).map((t) => ({ t, p: projects[i] })) : []));
    },
  });

  const go = (href: string) => () => {
    onClose();
    router.push(href);
  };

  const entries = useMemo<Entry[]>(() => {
    const needle = q.trim().toLowerCase();
    const match = (s: string) => !needle || s.toLowerCase().includes(needle);
    const out: Entry[] = [];
    out.push({ key: "a-task", section: "Hành động", label: "Tạo task mới", hint: "C", run: () => { onClose(); openCreateTask(); } });
    out.push({ key: "a-proj", section: "Hành động", label: "Tạo dự án mới", run: () => { onClose(); openCreateProject(); } });
    NAV.filter(([l]) => match(l)).forEach(([l, href]) => out.push({ key: `n-${href}`, section: "Điều hướng", label: l, run: go(href) }));
    projects.filter((p) => match(p.name)).forEach((p) =>
      out.push({
        key: `p-${p.id}`,
        section: "Dự án",
        label: p.name,
        run: go(`/projects/${p.id}/tasks`),
        extra: <span className="size-2 rounded-[2px]" style={{ background: projectColor(p.id) }} />,
      }),
    );
    (tasks.data ?? []).forEach(({ t, p }) =>
      out.push({
        key: `t-${t.id}`,
        section: "Task",
        label: t.title,
        hint: t.code,
        run: go(`/projects/${p.id}/tasks?task=${t.id}`),
        extra: <StatusChip status={t.status} size="sm" />,
      }),
    );
    return needle ? out.filter((e) => e.section !== "Hành động" || match(e.label)) : out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, projects, tasks.data]);

  useEffect(() => setActive(0), [q]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") (e.preventDefault(), setActive((a) => Math.min(a + 1, entries.length - 1)));
    else if (e.key === "ArrowUp") (e.preventDefault(), setActive((a) => Math.max(a - 1, 0)));
    else if (e.key === "Enter") (e.preventDefault(), entries[active]?.run());
  };

  let lastSection = "";
  return (
    <div onKeyDown={onKey} className="-mx-1 flex flex-col gap-2">
      <label htmlFor="cmd-q" className="sr-only">
        Tìm trang, dự án hoặc task
      </label>
      <input
        id="cmd-q"
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Tìm trang, dự án hoặc task…"
        role="combobox"
        aria-expanded="true"
        aria-controls="cmd-list"
        className="h-10 rounded-md border border-line-strong bg-surface px-3 text-[14px] outline-none focus:border-accent focus:ring-1 focus:ring-accent"
      />
      <ul id="cmd-list" ref={listRef} role="listbox" className="max-h-[340px] overflow-y-auto">
        {entries.map((e, i) => {
          const header = e.section !== lastSection ? e.section : null;
          lastSection = e.section;
          return (
            <li key={e.key} role="presentation">
              {header && <p className="px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-ink-faint">{header}</p>}
              <button
                type="button"
                role="option"
                aria-selected={i === active}
                data-idx={i}
                onMouseMove={() => setActive(i)}
                onClick={e.run}
                className={`flex h-9 w-full items-center gap-2.5 rounded-md px-2 text-left text-[13px] ${i === active ? "bg-accent-soft text-accent-ink" : "text-ink hover:bg-hover"}`}
              >
                {e.extra}
                <span className="min-w-0 flex-1 truncate">{e.label}</span>
                {e.hint && <span className="font-mono text-[11px] text-ink-faint">{e.hint}</span>}
              </button>
            </li>
          );
        })}
        {entries.length === 0 && <li className="px-2 py-6 text-center text-[13px] text-ink-muted">{tasks.isFetching ? "Đang tìm…" : "Không có kết quả"}</li>}
      </ul>
    </div>
  );
}
