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
import { tr } from "@/lib/i18n";

const key = (iso?: string) => (iso ? localDateKey(new Date(iso)) : "");

export function ModuleFormDialog({ open, module, projectId, onClose }: { open: boolean; module?: ModuleResponse | null; projectId: string; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title={module ? tr().moduleForm.edit : tr().moduleForm.create} width={520}>
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

  const problem = start && end && end < start ? tr().moduleForm.releaseAfterStart : null;
  const busy = create.isPending || update.isPending;

  const submit = () => {
    if (!name.trim() || problem) return;
    const dates = { ...(hasSprints ? {} : { startDate: start ? startOfDayISO(start) : undefined }), endDate: end ? endOfDayISO(end) : undefined };
    const done = { onSuccess: () => (toast.success(module ? tr().moduleForm.saved : tr().moduleForm.created), onClose()), onError: (e: unknown) => toast.error(e) };
    if (!module) create.mutate({ name: name.trim(), ...dates }, done);
    else update.mutate({ id: module.id, body: { name: name.trim(), ...dates, ...(status !== module.status ? { status } : {}) } }, done);
  };

  return (
    <form onSubmit={(e) => (e.preventDefault(), submit())} className="flex flex-col gap-4">
      <Field label={tr().moduleForm.name} required>
        {(p) => <Input {...p} autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />}
      </Field>
      {module && (
        <Field label={tr().moduleForm.status} hint={tr().moduleForm.statusHint}>
          {(p) => (
            <Select {...p} value={status} onChange={(e) => setStatus(e.target.value as ModuleStatus)}>
              {MODULE_STATUS_ORDER.map((s) => <option key={s} value={s}>{MODULE_STATUS_LABEL[s]}</option>)}
            </Select>
          )}
        </Field>
      )}
      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        {hasSprints ? (
          <Field label={tr().moduleForm.start} hint={tr().moduleForm.startFromSprint}>
            {(p) => <Input {...p} value={fmtDate(module?.startDate)} disabled readOnly />}
          </Field>
        ) : (
          <Field label={tr().moduleForm.startPlanned} hint={tr().moduleForm.startWillFollow}>
            {(p) => <Input {...p} type="date" value={start} onChange={(e) => setStart(e.target.value)} />}
          </Field>
        )}
        <Field label={tr().moduleForm.releaseDate} error={problem}>
          {(p) => <Input {...p} type="date" value={end} onChange={(e) => setEnd(e.target.value)} />}
        </Field>
      </div>
      {!module && <p className="text-[12px] text-ink-faint">{tr().moduleForm.afterCreate}</p>}
      <div className="flex justify-end gap-2 border-t border-line pt-3">
        <Button onClick={onClose}>{tr().moduleForm.cancel}</Button>
        <Button type="submit" variant="primary" loading={busy} disabled={!name.trim() || !!problem}>
          {module ? tr().moduleForm.save : tr().moduleForm.create}
        </Button>
      </div>
    </form>
  );
}
