import { getAccessToken, isTokenExpired, refreshAccessToken } from "../auth/tokenManager";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export interface RequestOptions {
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

type Query = object;

interface InternalOptions extends RequestOptions {
  body?: unknown;
  query?: Query;
  _retry?: boolean;
}

export const connId: string = (() => {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined") crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
})();

function buildQuery(query?: Query): string {
  if (!query) return "";
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === "") continue;
    sp.append(k, Array.isArray(v) ? v.join(",") : String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export async function request<T>(
  method: string,
  path: string,
  { body, query, headers: custom, signal, _retry }: InternalOptions = {},
): Promise<T> {
  const url = `/api/proxy/${path.replace(/^\//, "")}${buildQuery(query)}`;
  const isAuthCall = path.includes("/auth/") || path.startsWith("/public/");

  let token = getAccessToken();
  if (!token && !isAuthCall) {
    throw new ApiError("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại", 401);
  }
  if (token && !isAuthCall && isTokenExpired(token)) {
    token = await refreshAccessToken();
    if (!token) throw new ApiError("Không thể làm mới phiên đăng nhập, kiểm tra kết nối mạng và thử lại", 0);
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Conn-Id": connId,
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...custom,
  };
  if (token && !path.startsWith("/public/")) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  if (res.status === 401 && !_retry && !isAuthCall) {
    if (await refreshAccessToken()) {
      return request<T>(method, path, { body, query, headers: custom, signal, _retry: true });
    }
  }

  if (!res.ok) {
    const raw = await res.text();
    let data: unknown = raw;
    try {
      data = JSON.parse(raw);
    } catch {
      /* body không phải JSON */
    }
    const errField =
      data && typeof data === "object" ? (data as { error?: unknown }).error : undefined;
    const msg =
      (typeof errField === "string" && errField) ||
      (typeof data === "string" && data) ||
      `HTTP ${res.status}`;
    throw new ApiError(msg, res.status, data);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function requestBlob(
  method: string,
  path: string,
  { query, signal }: { query?: Query; signal?: AbortSignal } = {},
): Promise<Blob> {
  const url = `/api/proxy/${path.replace(/^\//, "")}${buildQuery(query)}`;

  let token = getAccessToken();
  if (!token) throw new ApiError("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại", 401);
  if (isTokenExpired(token)) {
    token = await refreshAccessToken();
    if (!token) throw new ApiError("Không thể làm mới phiên đăng nhập, kiểm tra kết nối mạng và thử lại", 0);
  }

  const res = await fetch(url, {
    method,
    headers: { "X-Conn-Id": connId, Authorization: `Bearer ${token}` },
    signal,
  });

  if (!res.ok) {
    const raw = await res.text();
    let data: unknown = raw;
    try {
      data = JSON.parse(raw);
    } catch {
      /* body không phải JSON */
    }
    const errField = data && typeof data === "object" ? (data as { error?: unknown }).error : undefined;
    const msg = (typeof errField === "string" && errField) || (typeof data === "string" && data) || `HTTP ${res.status}`;
    throw new ApiError(msg, res.status, data);
  }

  return res.blob();
}
