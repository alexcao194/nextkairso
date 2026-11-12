"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "@/lib/query/QueryProvider";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { WorkspaceProvider } from "@/lib/workspace/WorkspaceContext";
import { RealtimeProvider } from "@/lib/realtime/RealtimeProvider";
import { ToastProvider } from "@/lib/toast/ToastProvider";
import { LocaleProvider } from "@/lib/i18n";
import { PushManager } from "@/components/providers/PushManager";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <ToastProvider>
        <AuthProvider>
          <LocaleProvider>
            <WorkspaceProvider>
              <RealtimeProvider>
                <PushManager />
                {children}
              </RealtimeProvider>
            </WorkspaceProvider>
          </LocaleProvider>
        </AuthProvider>
      </ToastProvider>
    </QueryProvider>
  );
}
