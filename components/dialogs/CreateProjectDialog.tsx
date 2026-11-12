"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postWorkspaceProjects } from "@/lib/api/endpoints";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { useToast } from "@/lib/toast/ToastProvider";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/form";
import { tr } from "@/lib/i18n";

export function CreateProjectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title={tr().createProject.title} width={440}>
      <Form onClose={onClose} />
    </Modal>
  );
}

function Form({ onClose }: { onClose: () => void }) {
  const { workspaceId } = useWorkspace();
  const qc = useQueryClient();
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");

  const create = useMutation({
    mutationFn: () => postWorkspaceProjects(workspaceId, { name: name.trim() }),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success(tr().createProject.created(p.name));
      onClose();
      router.push(`/projects/${p.id}/tasks`);
    },
    onError: (e) => toast.error(e),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) create.mutate();
      }}
      className="flex flex-col gap-4"
    >
      <Field label={tr().createProject.name} required>
        {(p) => <Input {...p} autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Kairso Web" maxLength={120} />}
      </Field>
      <div className="flex justify-end gap-2">
        <Button onClick={onClose}>{tr().common.cancel}</Button>
        <Button type="submit" variant="primary" loading={create.isPending} disabled={!name.trim()}>
          {tr().createProject.title}
        </Button>
      </div>
    </form>
  );
}
