import { dateLocale, getLang } from "../i18n/state";

const toDate = (v: string | Date | null | undefined) => (v ? (v instanceof Date ? v : new Date(v)) : null);

export function fmtDate(v?: string | Date | null): string {
  const d = toDate(v);
  return d ? d.toLocaleDateString(dateLocale(), { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
}

export function fmtDayMonth(v?: string | Date | null): string {
  const d = toDate(v);
  return d ? d.toLocaleDateString(dateLocale(), { day: "2-digit", month: "2-digit" }) : "—";
}

export function fmtTime(v?: string | Date | null): string {
  const d = toDate(v);
  return d ? d.toLocaleTimeString(dateLocale(), { hour: "2-digit", minute: "2-digit", hour12: false }) : "—";
}

export const fmtDateTime = (v?: string | Date | null) => (toDate(v) ? `${fmtTime(v)} ${fmtDate(v)}` : "—");

export function fmtRelative(v?: string | Date | null): string {
  const d = toDate(v);
  if (!d) return "";
  const diff = (Date.now() - d.getTime()) / 1000;
  const en = getLang() === "en";
  if (diff < 45) return en ? "just now" : "vừa xong";
  if (diff < 3600) return en ? `${Math.round(diff / 60)}m ago` : `${Math.round(diff / 60)} phút trước`;
  if (diff < 86400) return en ? `${Math.round(diff / 3600)}h ago` : `${Math.round(diff / 3600)} giờ trước`;
  if (diff < 86400 * 7) return en ? `${Math.round(diff / 86400)}d ago` : `${Math.round(diff / 86400)} ngày trước`;
  return fmtDate(d);
}

export function initials(name?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function hashIndex(seed: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % mod;
}

const AVATAR_COUNT = 8;
export const avatarColor = (seed: string) => `var(--grad-${hashIndex(seed, AVATAR_COUNT) + 1})`;
export const projectColor = (seed: string) => `var(--avatar-${hashIndex(`p:${seed}`, AVATAR_COUNT) + 1})`;

export function startOfWeek(d: Date): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (r.getDay() + 6) % 7;
  r.setDate(r.getDate() - dow);
  return r;
}

export const addDays = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

export const monthKey = (d: Date) => `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}`;

/** Localized weekday name, e.g. "Thứ Hai" / "Monday". */
export const weekdayName = (d: Date, style: "long" | "short" = "long") => d.toLocaleDateString(dateLocale(), { weekday: style });

/** Localized "month/year" heading, e.g. "Tháng 11/2026" / "November 2026". */
export const monthTitle = (d: Date) =>
  getLang() === "en" ? d.toLocaleDateString("en-US", { month: "long", year: "numeric" }) : `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;

const VI_DOW_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

/** Compact weekday label for a date: "T2" / "Mon". */
export const weekdayShort = (d: Date) => (getLang() === "en" ? d.toLocaleDateString("en-US", { weekday: "short" }) : VI_DOW_SHORT[d.getDay()]);

/** Monday-first compact weekday headers for month grids. */
export const weekHeaders = () => [1, 2, 3, 4, 5, 6, 0].map((dow) => weekdayShort(new Date(2024, 0, 7 + dow)));

/** Compact month label for "YYYY-MM": "T11" / "Nov". */
export const shortMonth = (key: string) =>
  getLang() === "en" ? new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1).toLocaleDateString("en-US", { month: "short" }) : `T${Number(key.slice(5, 7))}`;

/** Month heading for "YYYY-MM". */
export const monthKeyTitle = (key: string) => monthTitle(new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1));
