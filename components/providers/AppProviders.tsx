"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "@/lib/query/QueryProvider";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { WorkspaceProvider } from "@/lib/workspace/WorkspaceContext";
import { RealtimeProvider } from "@/lib/realtime/RealtimeProvider";
import { ToastProvider } from "@/lib/toast/ToastProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <ToastProvider>
        <AuthProvider>
          <WorkspaceProvider>
            <RealtimeProvider>{children}</RealtimeProvider>
          </WorkspaceProvider>
        </AuthProvider>
      </ToastProvider>
    </QueryProvider>
  );
}
