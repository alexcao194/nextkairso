"use client";

import { useState, type ComponentProps } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getProjectModules } from "@/lib/api/endpoints";
import { fetchAll } from "@/lib/query/paged";
import { qk } from "@/lib/query/keys";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { useCurrencies, useCustomers, useQuoteMutations } from "@/lib/hooks/quotes";
import { currencyName } from "@/lib/domain/money";
import { useLocale, useT } from "@/lib/i18n";
import { useToast } from "@/lib/toast/ToastProvider";
import { Badge } from "@/components/ui/feedback";
import { Field, Select } from "@/components/ui/form";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

const STATUS_TONE: Record<string, ComponentProps<typeof Badge>["tone"]> = {
  draft: "neutral",
  sent: "accent",
  accepted: "success",
  rejected: "danger",
  cancelled: "neutral",
  expired: "warning",
};

export function QuoteStatusBadge({ status }: { status: string }) {
  const t = useT();
  return <Badge tone={STATUS_TONE[status] ?? "neutral"}>{t.quotes.status[status] ?? status}</Badge>;
}

export function CurrencySelect({ value, onChange, ...rest }: { value: string; onChange: (code: string) => void } & Omit<ComponentProps<typeof Select>, "value" | "onChange">) {
  const { lang } = useLocale();
  const q = useCurrencies();
  const list = q.data ?? [{ code: value, minorUnits: 0 }];
  return (
    <Select {...rest} value={value} onChange={(e) => onChange(e.target.value)}>
      {list.map((c) => {
        const code = c.code ?? "";
        return (
          <option key={code} value={code}>
            {code} — {currencyName(code, lang)}
          </option>
        );
      })}
    </Select>
  );
}

export function useProjectModules(projectId: string) {
  const { workspaceId } = useWorkspace();
  return useQuery({
    queryKey: qk.modules(workspaceId, projectId),
    queryFn: () => fetchAll((p) => getProjectModules(projectId, p)),
    enabled: !!workspaceId && !!projectId,
  });
}

/** Create a draft quote for a module, then open it in the editor. */
export function NewQuoteModal({ open, onClose, projectId: initialProject = "", moduleId: initialModule = "" }: { open: boolean; onClose: () => void; projectId?: string; moduleId?: string }) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const { workspaceId, projects } = useWorkspace();
  const [projectId, setProjectId] = useState(initialProject);
  const [moduleId, setModuleId] = useState(initialModule);
  const [customerId, setCustomerId] = useState("");
  const modules = useProjectModules(projectId);
  const customers = useCustomers(workspaceId);
  const { create } = useQuoteMutations(workspaceId);

  const submit = () =>
    create.mutate(
      { moduleId, customerId: customerId || undefined },
      {
        onSuccess: (q) => {
          toast.success(t.quotes.created);
          onClose();
          router.push(`/quotes/${q.id}`);
        },
        onError: (e) => toast.error(e),
      },
    );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t.quotes.newQuote}
      description={t.quotes.pickModuleFirst}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>{t.common.cancel}</Button>
          <Button variant="primary" disabled={!moduleId} loading={create.isPending} onClick={submit}>{t.quotes.create}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Field label={t.quotes.pickProject} required>
          {(p) => (
            <Select {...p} value={projectId} onChange={(e) => { setProjectId(e.target.value); setModuleId(""); }}>
              <option value="">—</option>
              {projects.map((pr) => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
            </Select>
          )}
        </Field>
        <Field label={t.quotes.pickModule} required>
          {(p) => (
            <Select {...p} value={moduleId} disabled={!projectId} onChange={(e) => setModuleId(e.target.value)}>
              <option value="">—</option>
              {(modules.data ?? []).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </Select>
          )}
        </Field>
        <Field label={t.quoteEditor.customer}>
          {(p) => (
            <Select {...p} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">{t.quoteEditor.noCustomer}</option>
              {(customers.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          )}
        </Field>
      </div>
    </Modal>
  );
}
