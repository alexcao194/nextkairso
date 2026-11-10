"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postWorkspaces } from "@/lib/api/endpoints";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { useToast } from "@/lib/toast/ToastProvider";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/form";

export function CreateWorkspaceDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Tạo workspace" description="Mỗi workspace có thành viên, dự án và chấm công riêng." width={440}>
      <Form onClose={onClose} />
    </Modal>
  );
}

function Form({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { setWorkspaceId } = useWorkspace();
  const toast = useToast();
  const [name, setName] = useState("");

  const create = useMutation({
    mutationFn: () => postWorkspaces({ name: name.trim() }),
    onSuccess: async (w) => {
      await qc.invalidateQueries({ queryKey: ["workspaces"] });
      setWorkspaceId(w.id);
      toast.success(`Đã tạo workspace ${w.name}`);
      onClose();
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
      <Field label="Tên workspace" required>
        {(p) => <Input {...p} autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Công ty ABC" maxLength={120} />}
      </Field>
      <div className="flex justify-end gap-2">
        <Button onClick={onClose}>Huỷ</Button>
        <Button type="submit" variant="primary" loading={create.isPending} disabled={!name.trim()}>
          Tạo workspace
        </Button>
      </div>
    </form>
  );
}
