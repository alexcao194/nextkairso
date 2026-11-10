"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteModule,
  deleteModuleAttachment,
  deleteModuleSprint,
  getModuleAttachments,
  getModuleHistory,
  patchModule,
  patchModuleSprint,
  postModuleAttachments,
  postModuleSprints,
  postProjectModules,
} from "@/lib/api/endpoints";
import type { CreateModuleAttachmentRequest, CreateModuleRequest, CreateModuleSprintRequest, UpdateModuleRequest, UpdateModuleSprintRequest } from "@/lib/api/schema";
import { fetchAll } from "@/lib/query/paged";
import { uploadFile } from "@/lib/upload";
import { qk } from "@/lib/query/keys";

export function useModuleMutations(projectId: string) {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["modules"] });
    qc.invalidateQueries({ queryKey: ["overviews"] });
    qc.invalidateQueries({ queryKey: ["module-history"] });
  };
  return {
    create: useMutation({ mutationFn: (b: CreateModuleRequest) => postProjectModules(projectId, b), onSuccess: refresh }),
    update: useMutation({ mutationFn: ({ id, body }: { id: string; body: UpdateModuleRequest }) => patchModule(id, body), onSuccess: refresh }),
    remove: useMutation({
      mutationFn: (id: string) => deleteModule(id),
      onSuccess: () => {
        refresh();
        qc.invalidateQueries({ queryKey: ["tasks"] });
      },
    }),
  };
}

export const useModuleAttachments = (id: string) =>
  useQuery({ queryKey: qk.moduleAttachments(id), queryFn: async () => (await getModuleAttachments(id)) ?? [], enabled: !!id });

export function useModuleAttachmentMutations(id: string) {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: qk.moduleAttachments(id) });
    qc.invalidateQueries({ queryKey: ["modules"] });
  };
  return {
    add: useMutation({ mutationFn: (b: CreateModuleAttachmentRequest) => postModuleAttachments(id, b), onSuccess: refresh }),
    remove: useMutation({ mutationFn: (aid: string) => deleteModuleAttachment(id, aid), onSuccess: refresh }),
  };
}

export const useModuleHistory = (id: string) =>
  useQuery({ queryKey: qk.moduleHistory(id), queryFn: () => fetchAll((q) => getModuleHistory(id, q), 50, 3), enabled: !!id });

export function useModuleUpload(id: string) {
  const { add } = useModuleAttachmentMutations(id);
  const [busy, setBusy] = useState(false);
  const upload = async (files: Iterable<File>) => {
    setBusy(true);
    let n = 0;
    try {
      for (const f of files) {
        const up = await uploadFile(f, "module_file", id);
        await add.mutateAsync({ fileName: up.fileName, fileUrl: up.fileUrl, contentType: up.contentType, sizeBytes: up.sizeBytes });
        n++;
      }
    } finally {
      setBusy(false);
    }
    return n;
  };
  return { upload, busy };
}

export function useSprintMutations(moduleId: string) {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["modules"] });
    qc.invalidateQueries({ queryKey: qk.moduleHistory(moduleId) });
  };
  return {
    create: useMutation({ mutationFn: (b: CreateModuleSprintRequest) => postModuleSprints(moduleId, b), onSuccess: refresh }),
    update: useMutation({ mutationFn: ({ id, body }: { id: string; body: UpdateModuleSprintRequest }) => patchModuleSprint(moduleId, id, body), onSuccess: refresh }),
    remove: useMutation({ mutationFn: (id: string) => deleteModuleSprint(moduleId, id), onSuccess: refresh }),
  };
}
