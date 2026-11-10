"use client";

import { useRef } from "react";
import type { ModuleResponse } from "@/lib/api/schema";
import { useModuleUpload } from "@/lib/hooks/modules";
import { useToast } from "@/lib/toast/ToastProvider";
import { IconButton } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/feedback";
import { IconPaperclip, IconUpload } from "@/components/icons";

export function ModuleDocsCell({ module: m, onOpen }: { module: ModuleResponse; onOpen: () => void }) {
  const toast = useToast();
  const { upload, busy } = useModuleUpload(m.id);
  const ref = useRef<HTMLInputElement>(null);
  const count = m.attachmentCount ?? 0;

  return (
    <span className="inline-flex items-center gap-0.5">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Tài liệu của ${m.name}: ${count}`}
        className={`inline-flex h-ctl-sm items-center gap-1 rounded-md px-1.5 font-mono text-[12px] hover:bg-hover ${count ? "text-ink" : "text-ink-faint"}`}
      >
        <IconPaperclip size={13} /> {count}
      </button>
      <input
        ref={ref}
        type="file"
        multiple
        className="sr-only"
        aria-label={`Chọn tài liệu cho ${m.name}`}
        onChange={async (e) => {
          const files = e.target.files;
          if (!files?.length) return;
          try {
            const n = await upload(files);
            toast.success(`Đã tải ${n} tài liệu lên ${m.name}`);
          } catch (err) {
            toast.error(err);
          } finally {
            e.target.value = "";
          }
        }}
      />
      <IconButton label={`Tải tài liệu lên ${m.name}`} variant="ghost" size="sm" disabled={busy} onClick={() => ref.current?.click()}>
        {busy ? <Spinner size={12} /> : <IconUpload size={13} />}
      </IconButton>
    </span>
  );
}
