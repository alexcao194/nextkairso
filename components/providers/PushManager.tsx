"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLocale } from "@/lib/i18n";
import { enablePush, onForegroundPush, pushPermission, pushSupported } from "@/lib/firebase/messaging";

/**
 * Keeps the web push token registered while signed in: refreshes it silently
 * when permission is already granted (and when the language changes, so the
 * stored device locale stays current), and surfaces foreground pushes.
 */
export function PushManager() {
  const { user } = useAuth();
  const { lang } = useLocale();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      if (!(await pushSupported())) return;
      if (pushPermission() !== "granted") return;
      await enablePush(lang);
      if (!active) return;
    })();
    return () => {
      active = false;
    };
  }, [user?.id, lang]);

  useEffect(() => {
    if (!user) return;
    const unsub = onForegroundPush((payload) => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread"] });
      const n = payload.notification;
      if (n && pushPermission() === "granted") {
        try {
          new Notification(n.title || "Kairso", {
            body: n.body,
            icon: "/icon-192.png",
            data: payload.data,
          });
        } catch {
          /* ignore */
        }
      }
    });
    return unsub;
  }, [user?.id, qc]);

  return null;
}
