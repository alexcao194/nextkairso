"use client";

import { useState } from "react";
import type { ModuleResponse } from "@/lib/api/schema";
import { MODULE_STATUS_LABEL, MODULE_STATUS_ORDER, type ModuleStatus } from "@/lib/domain/module";
import { localDateKey } from "@/lib/domain/task";
import { fmtDate } from "@/lib/domain/format";
import { endOfDayISO, startOfDayISO } from "@/lib/hooks/tasks";
import { useModuleMutations } from "@/lib/hooks/modules";
import { useToast } from "@/lib/toast/ToastProvider";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/form";

const key = (iso?: string) => (iso ? localDateKey(new Date(iso)) : "");

export function ModuleFormDialog({ open, module, projectId, onClose }: { open: boolean; module?: ModuleResponse | null; projectId: string; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title={module ? "Sửa module" : "Tạo module"} width={520}>
      <Form module={module ?? null} projectId={projectId} onClose={onClose} />
    </Modal>
  );
}

function Form({ module, projectId, onClose }: { module: ModuleResponse | null; projectId: string; onClose: () => void }) {
  const toast = useToast();
  const { create, update } = useModuleMutations(projectId);
  const hasSprints = (module?.sprints ?? []).length > 0;
  const [name, setName] = useState(module?.name ?? "");
  const [start, setStart] = useState(key(module?.startDate));
  const [end, setEnd] = useState(key(module?.endDate));
  const [status, setStatus] = useState<ModuleStatus>(module?.status ?? "backlog");

  const problem = start && end && end < start ? "Ngày phát hành phải sau ngày bắt đầu." : null;
  const busy = create.isPending || update.isPending;

  const submit = () => {
    if (!name.trim() || problem) return;
    const dates = { ...(hasSprints ? {} : { startDate: start ? startOfDayISO(start) : undefined }), endDate: end ? endOfDayISO(end) : undefined };
    const done = { onSuccess: () => (toast.success(module ? "Đã lưu module" : "Đã tạo module"), onClose()), onError: (e: unknown) => toast.error(e) };
    if (!module) create.mutate({ name: name.trim(), ...dates }, done);
    else update.mutate({ id: module.id, body: { name: name.trim(), ...dates, ...(status !== module.status ? { status } : {}) } }, done);
  };

  return (
    <form onSubmit={(e) => (e.preventDefault(), submit())} className="flex flex-col gap-4">
      <Field label="Tên module" required>
        {(p) => <Input {...p} autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />}
      </Field>
      {module && (
        <Field label="Trạng thái" hint="Product Backlog → Đang phát triển (tự chuyển khi bắt đầu sprint) → Done → Đã phát hành.">
          {(p) => (
            <Select {...p} value={status} onChange={(e) => setStatus(e.target.value as ModuleStatus)}>
              {MODULE_STATUS_ORDER.map((s) => <option key={s} value={s}>{MODULE_STATUS_LABEL[s]}</option>)}
            </Select>
          )}
        </Field>
      )}
      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        {hasSprints ? (
          <Field label="Bắt đầu" hint="Tự lấy từ sprint đầu tiên.">
            {(p) => <Input {...p} value={fmtDate(module?.startDate)} disabled readOnly />}
          </Field>
        ) : (
          <Field label="Bắt đầu (dự kiến)" hint="Sẽ theo sprint đầu tiên khi thêm sprint.">
            {(p) => <Input {...p} type="date" value={start} onChange={(e) => setStart(e.target.value)} />}
          </Field>
        )}
        <Field label="Ngày phát hành mục tiêu" error={problem}>
          {(p) => <Input {...p} type="date" value={end} onChange={(e) => setEnd(e.target.value)} />}
        </Field>
      </div>
      {!module && <p className="text-[12px] text-ink-faint">Sau khi tạo, mở module để chia thành các sprint (tối đa 1 tháng mỗi sprint).</p>}
      <div className="flex justify-end gap-2 border-t border-line pt-3">
        <Button onClick={onClose}>Huỷ</Button>
        <Button type="submit" variant="primary" loading={busy} disabled={!name.trim() || !!problem}>
          {module ? "Lưu" : "Tạo module"}
        </Button>
      </div>
    </form>
  );
}
