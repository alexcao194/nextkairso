"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api/endpoints";
import type {
  CreateFileRequest,
  CreateFolderRequest,
  CreateVersionRequest,
  UpdateFileRequest,
  UpdateFolderRequest,
  UpsertFileSettingsRequest,
} from "@/lib/api/schema";
import { qk } from "@/lib/query/keys";
import { tr } from "../i18n/dict";

export const useFileTree = (ws: string) =>
  useQuery({ queryKey: qk.fileTree(ws), queryFn: () => api.getWorkspaceFileManagerTree(ws), enabled: !!ws });

export const useFileSettings = (ws: string) =>
  useQuery({ queryKey: qk.fileSettings(ws), queryFn: () => api.getWorkspaceFileManagerSettings(ws), enabled: !!ws });

export const useFileVersions = (ws: string, fileId: string | null) =>
  useQuery({
    queryKey: qk.fileVersions(fileId ?? ""),
    queryFn: () => api.getWorkspaceFileManagerVersions(ws, fileId as string),
    enabled: !!ws && !!fileId,
  });

export function useFileMutations(ws: string) {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["file-tree", ws] });
  const refreshVersions = () => qc.invalidateQueries({ queryKey: ["file-versions"] });
  return {
    createFolder: useMutation({ mutationFn: (b: CreateFolderRequest) => api.postWorkspaceFileManagerFolders(ws, b), onSuccess: refresh }),
    updateFolder: useMutation({ mutationFn: (v: { id: string; body: UpdateFolderRequest }) => api.patchWorkspaceFileManagerFolder(ws, v.id, v.body), onSuccess: refresh }),
    deleteFolder: useMutation({ mutationFn: (id: string) => api.deleteWorkspaceFileManagerFolder(ws, id), onSuccess: refresh }),
    createFile: useMutation({ mutationFn: (b: CreateFileRequest) => api.postWorkspaceFileManager(ws, b), onSuccess: refresh }),
    updateFile: useMutation({ mutationFn: (v: { id: string; body: UpdateFileRequest }) => api.patchWorkspaceFileManager(ws, v.id, v.body), onSuccess: refresh }),
    deleteFile: useMutation({ mutationFn: (id: string) => api.deleteWorkspaceFileManager(ws, id), onSuccess: refresh }),
    addVersion: useMutation({
      mutationFn: (v: { id: string; body: CreateVersionRequest }) => api.postWorkspaceFileManagerVersions(ws, v.id, v.body),
      onSuccess: () => { refresh(); refreshVersions(); },
    }),
    restoreVersion: useMutation({
      mutationFn: (v: { id: string; versionId: string }) => api.postWorkspaceFileManagerVersionRestore(ws, v.id, v.versionId),
      onSuccess: () => { refresh(); refreshVersions(); },
    }),
    saveSettings: useMutation({ mutationFn: (b: UpsertFileSettingsRequest) => api.putWorkspaceFileManagerSettings(ws, b), onSuccess: () => qc.invalidateQueries({ queryKey: qk.fileSettings(ws) }) }),
  };
}

export async function presignAndUpload(ws: string, file: File): Promise<{ objectName: string; contentType: string; sizeBytes: number }> {
  const contentType = file.type || "application/octet-stream";
  const presigned = await api.postWorkspaceFileManagerPresign(ws, { filename: file.name, contentType, sizeBytes: file.size });
  if (!presigned.uploadUrl || !presigned.objectName) throw new Error(tr().ui.uploadUrlFailed);
  const ascii = file.name.replace(/"/g, "'").replace(/[^\x20-\x7E]/g, "_");
  const res = await fetch(presigned.uploadUrl, {
    method: presigned.method || "PUT",
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(file.name)}`,
    },
    body: file,
  });
  if (!res.ok) throw new Error(tr().ui.uploadFailed(res.status));
  return { objectName: presigned.objectName, contentType, sizeBytes: file.size };
}
