"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api/endpoints";
import type { Paged } from "@/lib/api/schema";
import { fetchAll } from "@/lib/query/paged";
import { qk } from "@/lib/query/keys";

export interface ResourceScope {
  ws: string;
  projectId?: string;
}

export interface Note { id: string; title: string; content: string; createdBy: { name?: string }; updatedAt: string }
export interface LinkItem { id: string; title: string; url: string; createdBy: { name?: string }; updatedAt: string }
interface FileItem { id: string; title: string; fileName: string; fileUrl: string; contentType: string; sizeBytes: number; createdBy: { name?: string }; updatedAt: string }
interface NewFile { title: string; fileName: string; fileUrl: string; contentType: string; sizeBytes: number }

export function useNotes(s: ResourceScope) {
  return useQuery<Note[]>({
    queryKey: qk.notes(s.ws, s.projectId),
    queryFn: () => fetchAll<Note>((q) => (s.projectId ? api.getWorkspaceProjectNotes(s.ws, s.projectId, q) : api.getWorkspaceNotes(s.ws, q)) as Promise<Paged<Note>>),
    enabled: !!s.ws,
  });
}
export function useLinks(s: ResourceScope) {
  return useQuery<LinkItem[]>({
    queryKey: qk.links(s.ws, s.projectId),
    queryFn: () => fetchAll<LinkItem>((q) => (s.projectId ? api.getWorkspaceProjectLinks(s.ws, s.projectId, q) : api.getWorkspaceLinks(s.ws, q)) as Promise<Paged<LinkItem>>),
    enabled: !!s.ws,
  });
}
export function useFiles(s: ResourceScope) {
  return useQuery<FileItem[]>({
    queryKey: qk.files(s.ws, s.projectId),
    queryFn: () => fetchAll<FileItem>((q) => (s.projectId ? api.getWorkspaceProjectFiles(s.ws, s.projectId, q) : api.getWorkspaceFiles(s.ws, q)) as Promise<Paged<FileItem>>),
    enabled: !!s.ws,
  });
}

export function useResourceMutations(s: ResourceScope) {
  const qc = useQueryClient();
  const p = s.projectId;
  const inv = (root: "notes" | "links" | "files") => () => qc.invalidateQueries({ queryKey: [root] });
  return {
    createNote: useMutation<unknown, Error, { title: string; content: string }>({
      mutationFn: (b: { title: string; content: string }) => (p ? api.postWorkspaceProjectNotes(s.ws, p, b) : api.postWorkspaceNotes(s.ws, b)),
      onSuccess: inv("notes"),
    }),
    updateNote: useMutation<unknown, Error, { id: string; body: { title?: string; content?: string } }>({
      mutationFn: ({ id, body }: { id: string; body: { title?: string; content?: string } }) =>
        p ? api.patchWorkspaceProjectNote(s.ws, p, id, body) : api.patchWorkspaceNote(s.ws, id, body),
      onSuccess: inv("notes"),
    }),
    deleteNote: useMutation({
      mutationFn: (id: string) => (p ? api.deleteWorkspaceProjectNote(s.ws, p, id) : api.deleteWorkspaceNote(s.ws, id)),
      onSuccess: inv("notes"),
    }),
    createLink: useMutation<unknown, Error, { title: string; url: string }>({
      mutationFn: (b: { title: string; url: string }) => (p ? api.postWorkspaceProjectLinks(s.ws, p, b) : api.postWorkspaceLinks(s.ws, b)),
      onSuccess: inv("links"),
    }),
    updateLink: useMutation({
      mutationFn: ({ id, body }: { id: string; body: { title?: string; url?: string } }) => {
        if (!p) throw new Error("Link workspace không sửa được — hãy xoá rồi tạo lại");
        return api.patchWorkspaceProjectLink(s.ws, p, id, body);
      },
      onSuccess: inv("links"),
    }),
    deleteLink: useMutation({
      mutationFn: (id: string) => (p ? api.deleteWorkspaceProjectLink(s.ws, p, id) : api.deleteWorkspaceLink(s.ws, id)),
      onSuccess: inv("links"),
    }),
    createFile: useMutation<unknown, Error, NewFile>({
      mutationFn: (b: NewFile) => (p ? api.postWorkspaceProjectFiles(s.ws, p, b) : api.postWorkspaceFiles(s.ws, b)),
      onSuccess: inv("files"),
    }),
    deleteFile: useMutation({
      mutationFn: (id: string) => (p ? api.deleteWorkspaceProjectFile(s.ws, p, id) : api.deleteWorkspaceFile(s.ws, id)),
      onSuccess: inv("files"),
    }),
  };
}
