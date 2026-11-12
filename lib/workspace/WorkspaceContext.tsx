"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getWorkspaceMembers,
  getWorkspaceMyTasksCount,
  getWorkspaceNotificationsUnreadCount,
  getWorkspaceProjects,
  getWorkspaceThreadsCount,
  getWorkspaces,
} from "../api/endpoints";
import type { ProjectResponse, WorkspaceMemberResponse, WorkspaceResponse, WorkspaceRole } from "../api/schema";
import { fetchAll } from "../query/paged";
import { qk } from "../query/keys";
import { useAuth } from "../auth/AuthContext";

const STORAGE_KEY = "kairso-workspace";

interface WorkspaceContextType {
  workspaces: WorkspaceResponse[];
  workspace: WorkspaceResponse | null;
  workspaceId: string;
  setWorkspaceId: (id: string) => void;
  role: WorkspaceRole | null;
  isHolder: boolean;
  isManager: boolean;
  members: WorkspaceMemberResponse[];
  memberById: (userId?: string | null) => WorkspaceMemberResponse | undefined;
  projects: ProjectResponse[];
  projectById: (id?: string | null) => ProjectResponse | undefined;
  unreadCount: number;
  myTasksCount: number;
  threadsCount: number;
  isLoading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const enabled = !!token && !!user;
  const [preferredId, setPreferredId] = useState<string>("");

  useEffect(() => {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get("ws");
      setPreferredId(fromUrl || localStorage.getItem(STORAGE_KEY) || "");
    } catch {
      /* storage bị chặn */
    }
  }, []);

  const wsQuery = useQuery({
    queryKey: qk.workspaces(),
    queryFn: () => fetchAll((q) => getWorkspaces(q)),
    enabled,
  });
  const workspaces = useMemo(() => wsQuery.data ?? [], [wsQuery.data]);
  const workspace = workspaces.find((w) => w.id === preferredId) ?? workspaces[0] ?? null;
  const workspaceId = workspace?.id ?? "";
  const on = enabled && !!workspaceId;

  const membersQuery = useQuery({
    queryKey: qk.members(workspaceId),
    queryFn: () => fetchAll((q) => getWorkspaceMembers(workspaceId, q)),
    enabled: on,
  });
  const projectsQuery = useQuery({
    queryKey: qk.projects(workspaceId),
    queryFn: () => fetchAll((q) => getWorkspaceProjects(workspaceId, q)),
    enabled: on,
  });
  const unread = useQuery({
    queryKey: qk.unread(workspaceId),
    queryFn: () => getWorkspaceNotificationsUnreadCount(workspaceId),
    enabled: on,
  });
  const myCount = useQuery({
    queryKey: qk.myTasksCount(workspaceId),
    queryFn: () => getWorkspaceMyTasksCount(workspaceId),
    enabled: on,
  });
  const threadsCount = useQuery({
    queryKey: qk.threadsCount(workspaceId),
    queryFn: () => getWorkspaceThreadsCount(workspaceId),
    enabled: on,
  });

  const members = useMemo(
    () => (membersQuery.data ?? []).filter((m) => m.status === "accepted"),
    [membersQuery.data],
  );
  const projects = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);
  const role = members.find((m) => m.userId === user?.id)?.role ?? null;

  const setWorkspaceId = useCallback((id: string) => {
    setPreferredId(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* bỏ qua */
    }
  }, []);

  const value = useMemo<WorkspaceContextType>(
    () => ({
      workspaces,
      workspace,
      workspaceId,
      setWorkspaceId,
      role,
      isHolder: role === "holder",
      isManager: role === "holder" || role === "admin",
      members,
      memberById: (id) => (id ? members.find((m) => m.userId === id) : undefined),
      projects,
      projectById: (id) => (id ? projects.find((p) => p.id === id) : undefined),
      unreadCount: unread.data?.unreadCount ?? 0,
      myTasksCount: myCount.data?.count ?? 0,
      threadsCount: threadsCount.data?.count ?? 0,
      isLoading: enabled && wsQuery.isLoading,
    }),
    [workspaces, workspace, workspaceId, setWorkspaceId, role, members, projects, unread.data, myCount.data, threadsCount.data, enabled, wsQuery.isLoading],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
