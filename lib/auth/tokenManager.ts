
const ACCESS_TOKEN_KEY = "kairso_access_token";
const REFRESH_TOKEN_KEY = "kairso_refresh_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken?: string): void {
  if (typeof window === "undefined") return;

  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";

  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  document.cookie = `${ACCESS_TOKEN_KEY}=${encodeURIComponent(accessToken)}; path=/; max-age=604800; SameSite=Lax${secure}`;

  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
  sessionExpiredNotified = false;
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);

  document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
  document.cookie = `${REFRESH_TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

export function isTokenExpired(token: string, offsetSeconds: number = 30): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;
    const expiryMs = payload.exp * 1000;
    return Date.now() + offsetSeconds * 1000 >= expiryMs;
  } catch {
    return true;
  }
}

const SESSION_EXPIRED_EVENT = "kairso:session-expired";
let sessionExpiredNotified = false;

function notifySessionExpired(): void {
  if (typeof window === "undefined" || sessionExpiredNotified) return;
  sessionExpiredNotified = true;
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

export function onSessionExpired(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(SESSION_EXPIRED_EVENT, cb);
  return () => window.removeEventListener(SESSION_EXPIRED_EVENT, cb);
}

let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearTokens();
    notifySessionExpired();
    return null;
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch("/api/proxy/v1/auth/refresh", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          clearTokens();
          notifySessionExpired();
        }
        return null;
      }

      const data = await response.json();
      if (data.accessToken) {
        setTokens(data.accessToken, data.refreshToken || refreshToken);
        sessionExpiredNotified = false;
        return data.accessToken as string;
      }

      clearTokens();
      notifySessionExpired();
      return null;
    } catch (err) {
      console.error("Token refresh failed:", err);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
