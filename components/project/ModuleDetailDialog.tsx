"use client";

import { useRef, useState } from "react";
import type { ModuleResponse } from "@/lib/api/schema";
import type { ModuleHistoryResponse } from "@/lib/api/schema";
import { MODULE_STATUS_COLOR, MODULE_STATUS_LABEL, isReleaseOverdue, nextModuleStatus, sprintSummary, type ModuleStatus } from "@/lib/domain/module";
import { fmtDate, fmtRelative } from "@/lib/domain/format";
import { useModuleAttachmentMutations, useModuleAttachments, useModuleHistory, useModuleMutations, useModuleUpload } from "@/lib/hooks/modules";
import { useToast } from "@/lib/toast/ToastProvider";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { AttachmentLink } from "@/components/kairso/TaskComments";
import { IconArrowRight, IconClose, IconEdit, IconUpload } from "@/components/icons";
import { ModuleSprints } from "./ModuleSprints";

export type ModuleDetailTab = "sprints" | "files" | "history";

export function ModuleDetailDialog({ module, tab = "sprints", onClose, onEdit }: { module: ModuleResponse | null; tab?: ModuleDetailTab; onClose: () => void; onEdit: (m: ModuleResponse) => void }) {
  return (
    <Modal open={!!module} onClose={onClose} title={module?.name ?? ""} width={720}>
      {module && <Body module={module} initialTab={tab} onEdit={onEdit} />}
    </Modal>
  );
}

function Body({ module, initialTab, onEdit }: { module: ModuleResponse; initialTab: ModuleDetailTab; onEdit: (m: ModuleResponse) => void }) {
  const [tab, setTab] = useState<ModuleDetailTab>(initialTab);
  const toast = useToast();
  const { update } = useModuleMutations(module.projectId);
  const next = nextModuleStatus(module.status);
  const overdue = isReleaseOverdue(module);
  const files = useModuleAttachments(module.id);
  const { remove } = useModuleAttachmentMutations(module.id);
  const { upload, busy } = useModuleUpload(module.id);
  const history = useModuleHistory(module.id);
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    try {
      const n = await upload(list);
      toast.success(`Đã tải lên ${n} tài liệu`);
    } catch (e) {
      toast.error(e);
    } finally {
      if (ref.current) ref.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-line p-2.5 text-[12.5px]">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <span className="size-2 rounded-full" style={{ background: MODULE_STATUS_COLOR[module.status] }} aria-hidden="true" />
          {MODULE_STATUS_LABEL[module.status]}
        </span>
        <span className="text-ink-muted">{sprintSummary(module)}</span>
        <span className={overdue ? "font-medium text-danger" : "text-ink-muted"}>
          Phát hành {module.status === "released" && module.releasedAt ? `${fmtDate(module.releasedAt)}` : module.endDate ? `dự kiến ${fmtDate(module.endDate)}${overdue ? " · trễ" : ""}` : "chưa đặt ngày"}
        </span>
        <span className="flex-1" />
        {next && (
          <Button
            size="sm"
            variant="primary"
            loading={update.isPending}
            onClick={() => update.mutate({ id: module.id, body: { status: next } }, { onSuccess: () => toast.success(`${module.name}: ${MODULE_STATUS_LABEL[next]}`), onError: (e) => toast.error(e) })}
          >
            {MODULE_STATUS_LABEL[next]} <IconArrowRight size={13} />
          </Button>
        )}
        <Button size="sm" onClick={() => onEdit(module)}>
          <IconEdit size={13} /> Sửa
        </Button>
      </div>
      <Tabs
        label="Chi tiết module"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "sprints", label: "Sprint", count: (module.sprints ?? []).length },
          { value: "files", label: "Tài liệu", count: files.data?.length ?? module.attachmentCount },
          { value: "history", label: "Lịch sử" },
        ]}
      />
      {tab === "sprints" ? (
        <ModuleSprints module={module} />
      ) : tab === "files" ? (
        <div className="flex flex-col gap-2">
          <input ref={ref} type="file" multiple className="sr-only" aria-label="Chọn file" onChange={(e) => onFiles(e.target.files)} />
          <button
            type="button"
            onClick={() => ref.current?.click()}
            onDragOver={(e) => (e.preventDefault(), setOver(true))}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              onFiles(e.dataTransfer.files);
            }}
            disabled={busy}
            className={`flex flex-col items-center gap-1 rounded-lg border border-dashed px-4 py-5 text-center transition-colors ${over ? "border-accent bg-accent-soft" : "border-line-strong hover:bg-hover"} disabled:cursor-wait`}
          >
            <IconUpload size={18} className="text-ink-faint" />
            <span className="text-[13px] font-medium text-ink">{busy ? "Đang tải lên…" : "Kéo thả tài liệu vào đây hoặc bấm để chọn"}</span>
            <span className="text-[11.5px] text-ink-faint">Nhiều file cùng lúc · PDF, Word, Excel, ảnh…</span>
          </button>
          {files.isLoading && <Skeleton className="h-9" />}
          {files.data?.length === 0 && <EmptyState title="Chưa có tài liệu" className="py-6" />}
          <ul className="flex flex-col gap-1.5">
            {(files.data ?? []).map((a) => (
              <li key={a.id} className="flex items-center gap-2">
                <AttachmentLink url={a.fileUrl} name={a.fileName} type={a.contentType} size={a.sizeBytes} />
                <button type="button" aria-label={`Xoá ${a.fileName}`} onClick={() => remove.mutate(a.id, { onError: (e) => toast.error(e) })} className="text-ink-faint hover:text-danger">
                  <IconClose size={12} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5 text-[12.5px]">
          {history.isLoading && <Skeleton className="h-16" />}
          {history.data?.length === 0 && <EmptyState title="Chưa có thay đổi" className="py-6" />}
          {(history.data ?? []).map((h) => (
            <li key={h.id}>
              <span className="font-medium">{h.changedBy.name}</span> {describeChange(h)}
              <span className="ml-2 text-ink-faint">{fmtRelative(h.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const FIELD_LABEL: Record<string, string> = { name: "tên", startDate: "ngày bắt đầu", endDate: "ngày phát hành mục tiêu", currentPhase: "giai đoạn" };

function describeChange(h: ModuleHistoryResponse) {
  const from = h.oldValue ?? "";
  const to = h.newValue ?? "";
  if (h.field === "sprint") {
    if (!from) return <>thêm <span className="font-medium">{to}</span></>;
    if (!to) return <>xoá <span className="font-medium">{from}</span></>;
    return <>cập nhật sprint <span className="text-ink-muted">{from}</span> → <span>{to}</span></>;
  }
  const label = (v: string) =>
    h.field === "status" ? MODULE_STATUS_LABEL[v as ModuleStatus] ?? v
    : h.field === "startDate" || h.field === "endDate" ? (v ? fmtDate(v) : "")
    : v;
  const name = h.field === "status" ? "trạng thái" : FIELD_LABEL[h.field] ?? h.field;
  return (
    <>
      đổi <span className="font-medium">{name}</span> từ <span className="text-ink-muted">{label(from) || "—"}</span> sang <span>{label(to) || "—"}</span>
    </>
  );
}
