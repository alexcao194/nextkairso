"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { CreateTaskDialog, type CreateTaskDefaults } from "./CreateTaskDialog";
import { CreateProjectDialog } from "./CreateProjectDialog";
import { CreateWorkspaceDialog } from "./CreateWorkspaceDialog";
import { ProfileDialog } from "./ProfileDialog";
import { CommandPalette } from "./CommandPalette";
import { CheckInDialog } from "./CheckInDialog";
import { ConfirmProvider } from "@/components/ui/Confirm";
import { WhatsNewDialog } from "@/components/kairso/WhatsNewDialog";

interface DialogsApi {
  openCreateTask: (defaults?: CreateTaskDefaults) => void;
  openCreateProject: () => void;
  openCreateWorkspace: () => void;
  openProfile: () => void;
  openCommandPalette: () => void;
  openCheckIn: () => void;
}

const DialogContext = createContext<DialogsApi | null>(null);

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLInputElement ||
  t instanceof HTMLTextAreaElement ||
  t instanceof HTMLSelectElement ||
  (t as HTMLElement | null)?.isContentEditable === true;

export function DialogProvider({ children }: { children: ReactNode }) {
  const [task, setTask] = useState<CreateTaskDefaults | null>(null);
  const [project, setProject] = useState(false);
  const [workspace, setWorkspace] = useState(false);
  const [profile, setProfile] = useState(false);
  const [palette, setPalette] = useState(false);
  const [checkIn, setCheckIn] = useState(false);

  const api = useMemo<DialogsApi>(
    () => ({
      openCreateTask: (d) => setTask(d ?? {}),
      openCreateProject: () => setProject(true),
      openCreateWorkspace: () => setWorkspace(true),
      openProfile: () => setProfile(true),
      openCommandPalette: () => setPalette(true),
      openCheckIn: () => setCheckIn(true),
    }),
    [],
  );

  const onKey = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      setPalette((o) => !o);
      return;
    }
    if (e.key.toLowerCase() === "c" && !e.metaKey && !e.ctrlKey && !e.altKey && !isTyping(e.target) && !document.querySelector("dialog[open]")) {
      e.preventDefault();
      setTask({});
    }
  }, []);
  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  return (
    <DialogContext.Provider value={api}>
      <ConfirmProvider>
        {children}
        <CreateTaskDialog defaults={task} onClose={() => setTask(null)} />
        <CreateProjectDialog open={project} onClose={() => setProject(false)} />
        <CreateWorkspaceDialog open={workspace} onClose={() => setWorkspace(false)} />
        <ProfileDialog open={profile} onClose={() => setProfile(false)} />
        <CommandPalette open={palette} onClose={() => setPalette(false)} />
        <CheckInDialog open={checkIn} onClose={() => setCheckIn(false)} />
        <WhatsNewDialog />
      </ConfirmProvider>
    </DialogContext.Provider>
  );
}

export function useDialogs(): DialogsApi {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialogs phải nằm trong DialogProvider");
  return ctx;
}
