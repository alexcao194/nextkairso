"use client";

import { useMemo, useRef, useState, type DragEvent } from "react";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { useToast } from "@/lib/toast/ToastProvider";
import { useConfirm } from "@/components/ui/Confirm";
import { presignAndUpload, useFileMutations, useFileSettings, useFileTree, useFileVersions } from "@/lib/hooks/files";
import type { FileResponse, TreeNode, TreeResponse } from "@/lib/api/schema";
import { Button, IconButton } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Menu } from "@/components/ui/Popover";
import { Field, Input, Switch } from "@/components/ui/form";
import { Badge, EmptyState, Skeleton } from "@/components/ui/feedback";
import {
  IconChevronRight, IconClock, IconDownload, IconEdit, IconFile, IconFolder,
  IconGlobe, IconMaximize, IconMore, IconPlus, IconSettings, IconTrash, IconUpload,
} from "@/components/icons";
import { fmtBytes, isImage } from "@/lib/upload";
import { dateLocale, tr } from "@/lib/i18n";

const DRAG_MIME = "application/x-kairso-file";

function computeEffectivePublic(data?: TreeResponse): Set<string> {
  const set = new Set<string>();
  const walk = (nodes: TreeNode[] | undefined, parentPublic: boolean) => {
    for (const n of nodes ?? []) {
      const pub = parentPublic && !!n.isPublic;
      if (pub && n.id) set.add(n.id);
      walk(n.children, pub);
    }
  };
  walk(data?.folders, true);
  return set;
}

export function FileManager() {
  const { workspaceId: ws, isManager } = useWorkspace();
  const toast = useToast();
  const confirm = useConfirm();
  const tree = useFileTree(ws);
  const settings = useFileSettings(ws);
  const m = useFileMutations(ws);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [sel, setSel] = useState<string>("");
  const [dragOver, setDragOver] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const [preview, setPreview] = useState<FileResponse | null>(null);
  const [versionsFor, setVersionsFor] = useState<FileResponse | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newFolder, setNewFolder] = useState<{ parentId: string } | null>(null);
  const [rename, setRename] = useState<{ kind: "folder" | "file"; id: string; name: string } | null>(null);

  const fileInput = useRef<HTMLInputElement>(null);
  const effPublic = useMemo(() => computeEffectivePublic(tree.data), [tree.data]);

  const toggle = (id: string) =>
    setExpanded((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const doUpload = async (files: FileList | File[], folderId: string) => {
    setBusy(true);
    try {
      for (const f of Array.from(files)) {
        const up = await presignAndUpload(ws, f);
        await m.createFile.mutateAsync({ folderId: folderId || "", name: f.name, objectName: up.objectName, contentType: up.contentType, sizeBytes: up.sizeBytes, isPublic: false });
      }
      toast.success(Array.from(files).length > 1 ? tr().fm.uploadedMany : tr().fm.uploadedOne);
    } catch (e) {
      toast.error(e);
    } finally {
      setBusy(false);
    }
  };

  const onPickUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) doUpload(e.target.files, sel);
    e.target.value = "";
  };

  const togglePublic = async (kind: "folder" | "file", id: string, val: boolean) => {
    try {
      if (kind === "file") await m.updateFile.mutateAsync({ id, body: { isPublic: val } });
      else await m.updateFolder.mutateAsync({ id, body: { isPublic: val } });
    } catch (e) {
      toast.error(e);
    }
  };

  const del = async (kind: "folder" | "file", id: string, name: string) => {
    const ok = await confirm({
      title: tr().fm.confirmDelete(kind === "file", name),
      message: kind === "folder" ? tr().fm.deleteFolderDesc : undefined,
      danger: true,
    });
    if (!ok) return;
    try {
      if (kind === "file") await m.deleteFile.mutateAsync(id);
      else await m.deleteFolder.mutateAsync(id);
      toast.success(tr().fm.deleted);
    } catch (e) {
      toast.error(e);
    }
  };

  const onDropInto = async (e: DragEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver("");
    if (!isManager) return;
    if (e.dataTransfer.files?.length) {
      await doUpload(e.dataTransfer.files, folderId);
      return;
    }
    const raw = e.dataTransfer.getData(DRAG_MIME);
    if (!raw) return;
    try {
      const { kind, id } = JSON.parse(raw) as { kind: "folder" | "file"; id: string };
      if (id === folderId) return;
      if (kind === "file") await m.updateFile.mutateAsync({ id, body: { folderId: folderId || "" } });
      else await m.updateFolder.mutateAsync({ id, body: { parentId: folderId || "" } });
      toast.success(tr().fm.moved);
    } catch (err) {
      toast.error(err);
    }
  };

  const allowDrop = (e: DragEvent, id: string) => {
    if (!isManager) return;
    e.preventDefault();
    setDragOver(id);
  };

  if (tree.isLoading) {
    return (
      <div className="flex flex-col gap-1.5 p-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-row w-full" />)}
      </div>
    );
  }
  if (tree.error) {
    return <div className="p-4"><EmptyState title={tr().fm.loadFailed} description={String((tree.error as Error).message ?? tree.error)} /></div>;
  }

  const data = tree.data ?? { folders: [], rootFiles: [] };
  const isEmpty = (data.folders?.length ?? 0) === 0 && (data.rootFiles?.length ?? 0) === 0;
  const selName = sel ? findFolderName(data.folders, sel) : tr().fm.root;

  return (
    <div className="flex h-full flex-col">
      {/* Thanh công cụ */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2.5">
        <span className="text-[12px] text-ink-muted">
          {tr().fm.location} <button type="button" className="font-medium text-ink underline-offset-2 hover:underline" onClick={() => setSel("")}>{selName}</button>
        </span>
        <span className="flex-1" />
        {isManager && (
          <>
            <input ref={fileInput} type="file" multiple hidden onChange={onPickUpload} />
            <Button size="sm" variant="ghost" onClick={() => setNewFolder({ parentId: sel })}><IconPlus size={14} /> {tr().fm.folder}</Button>
            <Button size="sm" variant="primary" loading={busy} onClick={() => fileInput.current?.click()}><IconUpload size={14} /> {tr().fm.upload}</Button>
            <IconButton label={tr().fm.uploadSettings} variant="ghost" size="sm" onClick={() => setSettingsOpen(true)}><IconSettings size={15} /></IconButton>
          </>
        )}
      </div>

      {/* Cây */}
      <div
        className={`min-h-0 flex-1 overflow-auto p-2 ${dragOver === "__root__" ? "bg-(--blue-soft)" : ""}`}
        onDragOver={(e) => allowDrop(e, "__root__")}
        onDragLeave={() => setDragOver("")}
        onDrop={(e) => onDropInto(e, "")}
      >
        {isEmpty && (
          <div className="p-6">
            <EmptyState
              title={tr().fm.none}
              description={isManager ? tr().fm.noneManager : tr().fm.noneMember}
            />
          </div>
        )}
        {data.folders?.map((n) => (
          <FolderRow
            key={n.id}
            node={n}
            depth={0}
            ctx={{ ws, isManager, expanded, toggle, sel, setSel, dragOver, setDragOver, allowDrop, onDropInto, effPublic, togglePublic, del, setRename, setNewFolder, setPreview, setVersionsFor }}
          />
        ))}
        {data.rootFiles?.map((f) => (
          <FileRow key={f.id} file={f} depth={0} ctx={{ isManager, effPublic, togglePublic, del, setRename, setPreview, setVersionsFor }} />
        ))}
      </div>

      {/* Modals */}
      {newFolder && <NewFolderModal ws={ws} parentId={newFolder.parentId} onClose={() => setNewFolder(null)} />}
      {rename && <RenameModal rename={rename} onClose={() => setRename(null)} />}
      {preview && <PreviewModal file={preview} onClose={() => setPreview(null)} />}
      {versionsFor && <VersionsModal ws={ws} file={versionsFor} isManager={isManager} onClose={() => setVersionsFor(null)} />}
      {settingsOpen && <SettingsModal ws={ws} current={settings.data} onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}

function findFolderName(folders: TreeNode[] | undefined, id: string): string {
  for (const n of folders ?? []) {
    if (n.id === id) return n.name ?? "";
    const inner = findFolderName(n.children, id);
    if (inner) return inner;
  }
  return "";
}

type FolderCtx = {
  ws: string;
  isManager: boolean;
  expanded: Set<string>;
  toggle: (id: string) => void;
  sel: string;
  setSel: (id: string) => void;
  dragOver: string;
  setDragOver: (id: string) => void;
  allowDrop: (e: DragEvent, id: string) => void;
  onDropInto: (e: DragEvent, id: string) => void;
  effPublic: Set<string>;
  togglePublic: (kind: "folder" | "file", id: string, val: boolean) => void;
  del: (kind: "folder" | "file", id: string, name: string) => void;
  setRename: (r: { kind: "folder" | "file"; id: string; name: string }) => void;
  setNewFolder: (v: { parentId: string }) => void;
  setPreview: (f: FileResponse) => void;
  setVersionsFor: (f: FileResponse) => void;
};

function FolderRow({ node, depth, ctx }: { node: TreeNode; depth: number; ctx: FolderCtx }) {
  const id = node.id ?? "";
  const name = node.name ?? "";
  const kind = node.kind ?? "custom";
  const open = ctx.expanded.has(id);
  const locked = kind !== "custom";
  const pubEff = ctx.effPublic.has(id);
  const isDragTarget = ctx.dragOver === id;
  const start = (e: DragEvent) => {
    if (locked || !ctx.isManager) return;
    e.dataTransfer.setData(DRAG_MIME, JSON.stringify({ kind: "folder", id: id }));
    e.dataTransfer.effectAllowed = "move";
  };
  return (
    <div>
      <div
        draggable={!locked && ctx.isManager}
        onDragStart={start}
        onDragOver={(e) => ctx.allowDrop(e, id)}
        onDragLeave={() => ctx.setDragOver("")}
        onDrop={(e) => ctx.onDropInto(e, id)}
        onClick={() => ctx.setSel(id)}
        className={`group flex h-row cursor-pointer items-center gap-1 rounded-md pr-1 hover:bg-hover ${ctx.sel === id ? "bg-(--blue-soft)" : ""} ${isDragTarget ? "ring-1 ring-accent" : ""}`}
        style={{ paddingLeft: depth * 16 + 4 }}
      >
        <button type="button" aria-label={open ? tr().fm.collapse : tr().fm.expand} onClick={(e) => { e.stopPropagation(); ctx.toggle(id); }} className="grid size-5 place-items-center text-ink-faint">
          <IconChevronRight size={13} className={`transition-transform ${open ? "rotate-90" : ""}`} />
        </button>
        <IconFolder size={15} className={locked ? "text-(--blue)" : "text-ink-muted"} />
        <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink">{name}</span>
        {locked && <Badge tone="neutral">{kind === "project" ? tr().fm.project : "Module"}</Badge>}
        {ctx.isManager && (
          <IconButton
            label={pubEff ? tr().fm.publicOn : node.isPublic ? tr().fm.publicHidden : tr().fm.private}
            variant="ghost" size="sm" className={pubEff ? "text-(--green)" : node.isPublic ? "text-(--amber)" : "text-ink-disabled"}
            onClick={(e) => { e.stopPropagation(); ctx.togglePublic("folder", id, !node.isPublic); }}
          ><IconGlobe size={14} /></IconButton>
        )}
        {ctx.isManager && (
          <Menu
            align="end"
            trigger={({ ref, open: mo, ...p }) => (
              <button ref={ref} {...p} aria-label={tr().fm.folderActions} className={`grid size-6 place-items-center rounded text-ink-faint hover:bg-hover hover:text-ink ${mo ? "bg-hover" : "opacity-0 group-hover:opacity-100"}`}><IconMore size={15} /></button>
            )}
            items={[
              { label: tr().fm.newSubfolder, icon: <IconPlus size={14} />, onSelect: () => ctx.setNewFolder({ parentId: id }) },
              ...(locked ? [] : [
                { label: tr().fm.rename, icon: <IconEdit size={14} />, onSelect: () => ctx.setRename({ kind: "folder", id: id, name: name }) },
                { label: tr().fm.delete, icon: <IconTrash size={14} />, danger: true, separated: true, onSelect: () => ctx.del("folder", id, name) },
              ]),
            ]}
          />
        )}
      </div>
      {open && (
        <div>
          {node.children?.map((c) => <FolderRow key={c.id} node={c} depth={depth + 1} ctx={ctx} />)}
          {node.files?.map((f) => <FileRow key={f.id} file={f} depth={depth + 1} ctx={ctx} />)}
          {!node.children?.length && !node.files?.length && (
            <div className="text-[11.5px] text-ink-faint" style={{ paddingLeft: (depth + 1) * 16 + 28 }}>{tr().fm.empty}</div>
          )}
        </div>
      )}
    </div>
  );
}

function FileRow({ file, depth, ctx }: {
  file: FileResponse;
  depth: number;
  ctx: Pick<FolderCtx, "isManager" | "effPublic" | "togglePublic" | "del" | "setRename" | "setPreview" | "setVersionsFor">;
}) {
  const fid = file.id ?? "";
  const fname = file.name ?? "";
  const furl = file.url ?? "";
  const parentPub = file.folderId ? ctx.effPublic.has(file.folderId) : false;
  const pubEff = !!file.isPublic && parentPub;
  const start = (e: DragEvent) => {
    if (!ctx.isManager) return;
    e.dataTransfer.setData(DRAG_MIME, JSON.stringify({ kind: "file", id: fid }));
    e.dataTransfer.effectAllowed = "move";
  };
  const previewable = isImage(file.contentType, file.name) || (file.contentType ?? "").includes("pdf");
  return (
    <div
      draggable={ctx.isManager}
      onDragStart={start}
      className="group flex h-row items-center gap-1 rounded-md pr-1 hover:bg-hover"
      style={{ paddingLeft: depth * 16 + 24 }}
    >
      <IconFile size={15} className="text-ink-faint" />
      <button type="button" className="min-w-0 flex-1 truncate text-left text-[12.5px] text-ink hover:underline" onClick={() => (previewable ? ctx.setPreview(file) : window.open(furl, "_blank"))} title={fname}>
        {fname}
      </button>
      <span className="hidden shrink-0 font-mono text-[11px] text-ink-faint sm:block">{fmtBytes(file.sizeBytes)}</span>
      {ctx.isManager && (
        <IconButton
          label={pubEff ? tr().fm.publicOn : file.isPublic ? tr().fm.publicHiddenFile : tr().fm.private}
          variant="ghost" size="sm" className={pubEff ? "text-(--green)" : file.isPublic ? "text-(--amber)" : "text-ink-disabled"}
          onClick={() => ctx.togglePublic("file", fid, !file.isPublic)}
        ><IconGlobe size={14} /></IconButton>
      )}
      <a href={furl} target="_blank" rel="noreferrer" className="grid size-6 place-items-center rounded text-ink-faint hover:bg-hover hover:text-ink" aria-label={tr().fm.download} download><IconDownload size={14} /></a>
      {ctx.isManager && (
        <Menu
          align="end"
          trigger={({ ref, open: mo, ...p }) => (
            <button ref={ref} {...p} aria-label={tr().fm.fileActions} className={`grid size-6 place-items-center rounded text-ink-faint hover:bg-hover hover:text-ink ${mo ? "bg-hover" : "opacity-0 group-hover:opacity-100"}`}><IconMore size={15} /></button>
          )}
          items={[
            ...(previewable ? [{ label: tr().fm.preview, icon: <IconMaximize size={14} />, onSelect: () => ctx.setPreview(file) }] : []),
            { label: tr().fm.versions, icon: <IconClock size={14} />, onSelect: () => ctx.setVersionsFor(file) },
            { label: tr().fm.rename, icon: <IconEdit size={14} />, onSelect: () => ctx.setRename({ kind: "file", id: fid, name: fname }) },
            { label: tr().fm.delete, icon: <IconTrash size={14} />, danger: true, separated: true, onSelect: () => ctx.del("file", fid, fname) },
          ]}
        />
      )}
    </div>
  );
}

function NewFolderModal({ ws, parentId, onClose }: { ws: string; parentId: string; onClose: () => void }) {
  const m = useFileMutations(ws);
  const toast = useToast();
  const [name, setName] = useState("");
  const save = async () => {
    if (!name.trim()) return;
    try {
      await m.createFolder.mutateAsync({ parentId: parentId || "", name: name.trim(), isPublic: false });
      toast.success(tr().fm.folderCreated);
      onClose();
    } catch (e) {
      toast.error(e);
    }
  };
  return (
    <Modal open onClose={onClose} title={tr().fm.newFolder} footer={<><Button variant="ghost" onClick={onClose}>{tr().fm.cancel}</Button><Button variant="primary" loading={m.createFolder.isPending} onClick={save} disabled={!name.trim()}>{tr().fm.create}</Button></>}>
      <Field label={tr().fm.folderName}>{(p) => <Input {...p} autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} placeholder={tr().fm.folderPh} />}</Field>
    </Modal>
  );
}

function RenameModal({ rename, onClose }: { rename: { kind: "folder" | "file"; id: string; name: string }; onClose: () => void }) {
  const { workspaceId: ws } = useWorkspace();
  const m = useFileMutations(ws);
  const toast = useToast();
  const [name, setName] = useState(rename.name);
  const save = async () => {
    if (!name.trim()) return;
    try {
      if (rename.kind === "file") await m.updateFile.mutateAsync({ id: rename.id, body: { name: name.trim() } });
      else await m.updateFolder.mutateAsync({ id: rename.id, body: { name: name.trim() } });
      toast.success(tr().fm.renamed);
      onClose();
    } catch (e) {
      toast.error(e);
    }
  };
  return (
    <Modal open onClose={onClose} title={tr().fm.rename} footer={<><Button variant="ghost" onClick={onClose}>{tr().fm.cancel}</Button><Button variant="primary" onClick={save} disabled={!name.trim()}>{tr().fm.save}</Button></>}>
      <Field label={tr().fm.newName}>{(p) => <Input {...p} autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} />}</Field>
    </Modal>
  );
}

function PreviewModal({ file, onClose }: { file: FileResponse; onClose: () => void }) {
  const img = isImage(file.contentType, file.name);
  const name = file.name ?? tr().fm.file;
  const furl = file.url ?? "";
  return (
    <Modal open onClose={onClose} title={name} width={760} footer={<a href={furl} target="_blank" rel="noreferrer" download><Button variant="ghost"><IconDownload size={14} /> {tr().fm.download}</Button></a>}>
      {img ? (
        <img src={furl} alt={name} className="mx-auto max-h-[70vh] rounded-md" />
      ) : (
        <iframe src={furl} title={name} className="h-[70vh] w-full rounded-md border border-line" />
      )}
    </Modal>
  );
}

function VersionsModal({ ws, file, isManager, onClose }: { ws: string; file: FileResponse; isManager: boolean; onClose: () => void }) {
  const fid = file.id ?? "";
  const versions = useFileVersions(ws, fid);
  const m = useFileMutations(ws);
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const addVersion = async (f: File) => {
    setBusy(true);
    try {
      const up = await presignAndUpload(ws, f);
      await m.addVersion.mutateAsync({ id: fid, body: { objectName: up.objectName, contentType: up.contentType, sizeBytes: up.sizeBytes } });
      toast.success(tr().fm.versionUploaded);
    } catch (e) {
      toast.error(e);
    } finally {
      setBusy(false);
    }
  };
  const restore = async (versionId: string) => {
    try {
      await m.restoreVersion.mutateAsync({ id: fid, versionId });
      toast.success(tr().fm.versionRestored);
    } catch (e) {
      toast.error(e);
    }
  };

  return (
    <Modal open onClose={onClose} title={tr().fm.versionsOf(file.name ?? "")} width={560}
      footer={isManager ? <><input ref={input} type="file" hidden onChange={(e) => { if (e.target.files?.[0]) addVersion(e.target.files[0]); e.target.value = ""; }} /><Button variant="primary" loading={busy} onClick={() => input.current?.click()}><IconUpload size={14} /> {tr().fm.uploadVersion}</Button></> : undefined}>
      {versions.isLoading && <Skeleton className="h-16 w-full" />}
      {versions.data && versions.data.length === 0 && <p className="text-[12.5px] text-ink-muted">{tr().fm.noVersions}</p>}
      <ul className="flex flex-col gap-1">
        {versions.data?.map((v, i) => (
          <li key={v.id} className="flex items-center gap-2 rounded-md border border-line px-2.5 py-1.5">
            <IconClock size={14} className="text-ink-faint" />
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] text-ink">{i === 0 ? tr().fm.current : tr().fm.versionN(versions.data!.length - i)} · <span className="font-mono text-[11px] text-ink-faint">{fmtBytes(v.sizeBytes)}</span></p>
              <p className="text-[11px] text-ink-faint">{new Date(v.createdAt).toLocaleString(dateLocale())}</p>
            </div>
            <a href={v.url} target="_blank" rel="noreferrer" download><IconButton label={tr().fm.download} variant="ghost" size="sm"><IconDownload size={14} /></IconButton></a>
            {isManager && i !== 0 && <Button size="sm" variant="ghost" onClick={() => restore(v.id)}>{tr().fm.restore}</Button>}
          </li>
        ))}
      </ul>
    </Modal>
  );
}

function SettingsModal({ ws, current, onClose }: { ws: string; current?: { maxFileSizeMb: number; allowedTypes: string }; onClose: () => void }) {
  const m = useFileMutations(ws);
  const toast = useToast();
  const [maxMB, setMaxMB] = useState(String(current?.maxFileSizeMb ?? 50));
  const [types, setTypes] = useState(current?.allowedTypes ?? "");
  const save = async () => {
    const n = parseInt(maxMB, 10);
    if (!n || n < 1 || n > 5000) return toast.error(tr().fm.maxSizeRange);
    try {
      await m.saveSettings.mutateAsync({ maxFileSizeMb: n, allowedTypes: types.trim() });
      toast.success(tr().fm.settingsSaved);
      onClose();
    } catch (e) {
      toast.error(e);
    }
  };
  return (
    <Modal open onClose={onClose} title={tr().fm.uploadSettings} description={tr().fm.settingsDesc}
      footer={<><Button variant="ghost" onClick={onClose}>{tr().fm.cancel}</Button><Button variant="primary" loading={m.saveSettings.isPending} onClick={save}>{tr().fm.save}</Button></>}>
      <div className="flex flex-col gap-3">
        <Field label={tr().fm.maxSize}>{(p) => <Input {...p} type="number" min={1} max={5000} value={maxMB} onChange={(e) => setMaxMB(e.target.value)} />}</Field>
        <Field label={tr().fm.allowedTypes} hint={tr().fm.allowedHint}>{(p) => <Input {...p} value={types} onChange={(e) => setTypes(e.target.value)} placeholder="pdf,png,jpg,docx" />}</Field>
      </div>
    </Modal>
  );
}
