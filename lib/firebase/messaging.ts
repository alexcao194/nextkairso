// Web push via Firebase Cloud Messaging. Registers a service worker, obtains an
// FCM token and registers it with the backend (POST /v1/devices). The backend
// renders the push text in the device's locale, so we send the current locale.
import { deleteToken, getMessaging, getToken, isSupported, onMessage, type MessagePayload } from "firebase/messaging";
import { deleteDevices, postDevices } from "../api/endpoints";
import { runtimeEnv } from "../config/env";
import { buildFirebaseConfig, getFirebaseApp } from "./client";

const TOKEN_KEY = "kairso-push-token";

export type EnablePushResult = "enabled" | "blocked" | "unsupported" | "no-vapid" | "error";

function vapidKey(): string {
  return runtimeEnv().firebaseVapidKey || process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "";
}

export async function pushSupported(): Promise<boolean> {
  try {
    return (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "Notification" in window &&
      (await isSupported())
    );
  } catch {
    return false;
  }
}

export function pushPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  // The SW can't read the runtime env file, so pass the public Firebase config
  // as query params for it to initialize with.
  const cfg = buildFirebaseConfig() as Record<string, string>;
  const params = new URLSearchParams(cfg).toString();
  return navigator.serviceWorker.register(`/firebase-messaging-sw.js?${params}`, { scope: "/" });
}

/** Request permission (if needed), get an FCM token and register it with the backend. */
export async function enablePush(locale: string): Promise<EnablePushResult> {
  if (!(await pushSupported())) return "unsupported";
  if (!vapidKey()) return "no-vapid";
  let permission = Notification.permission;
  if (permission === "default") permission = await Notification.requestPermission();
  if (permission !== "granted") return "blocked";
  try {
    const registration = await registerServiceWorker();
    const messaging = getMessaging(getFirebaseApp());
    const token = await getToken(messaging, { vapidKey: vapidKey(), serviceWorkerRegistration: registration });
    if (!token) return "error";
    await postDevices({ token, platform: "web", locale });
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* ignore */
    }
    return "enabled";
  } catch (err) {
    console.warn("enablePush failed", err);
    return "error";
  }
}

export async function disablePush(): Promise<void> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    if (token) await deleteDevices({ token }).catch(() => {});
    if (await pushSupported()) {
      const messaging = getMessaging(getFirebaseApp());
      await deleteToken(messaging).catch(() => {});
    }
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

/** Subscribe to foreground push messages. Returns an unsubscribe function. */
export function onForegroundPush(cb: (payload: MessagePayload) => void): () => void {
  let unsub = () => {};
  (async () => {
    if (!(await pushSupported())) return;
    const messaging = getMessaging(getFirebaseApp());
    unsub = onMessage(messaging, cb);
  })();
  return () => unsub();
}
