// Money is exchanged with the backend as integers in the currency's minor unit
// (cents, xu…). `minorUnits` (0, 2 or 3) always comes from the server so
// display and storage agree even where Intl's defaults differ.
import { dateLocale, type Lang } from "@/lib/i18n";

export function formatMoney(minor: number, currency: string, minorUnits: number, lang?: Lang): string {
  const value = minor / 10 ** minorUnits;
  try {
    return new Intl.NumberFormat(dateLocale(lang), {
      style: "currency",
      currency,
      minimumFractionDigits: minorUnits,
      maximumFractionDigits: minorUnits,
    }).format(value);
  } catch {
    return `${value.toFixed(minorUnits)} ${currency}`;
  }
}

/** Format a plain number (quantity, major-unit amount) for the current locale. */
export function formatNumber(n: number, maxFraction = 3, lang?: Lang): string {
  return new Intl.NumberFormat(dateLocale(lang), { maximumFractionDigits: maxFraction }).format(n);
}

/** Major-unit number (as typed by the user) → integer minor units. */
export function toMinor(major: number, minorUnits: number): number {
  return Math.round(major * 10 ** minorUnits);
}

/** Integer minor units → major-unit number for editing. */
export function fromMinor(minor: number, minorUnits: number): number {
  return minor / 10 ** minorUnits;
}

/** Parse user input that may use "," or "." as decimal separator and spaces/dots as grouping. */
export function parseDecimal(input: string): number {
  const s = input.trim().replace(/\s/g, "");
  if (!s) return 0;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  let normalized = s;
  if (lastComma > -1 && lastDot > -1) {
    // the later separator is the decimal one
    normalized = lastComma > lastDot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (lastComma > -1) {
    normalized = s.replace(",", ".");
  }
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

/** Localized currency display name, e.g. "US Dollar" / "Đô la Mỹ". */
export function currencyName(code: string, lang?: Lang): string {
  try {
    return new Intl.DisplayNames([dateLocale(lang)], { type: "currency" }).of(code) ?? code;
  } catch {
    return code;
  }
}

// Client mirror of the server's rounding so the editor can preview totals
// before saving (the server recomputes and is authoritative).
export function lineTotalMinor(quantity: number, unitPrice: number, discountPercent: number): number {
  return Math.round(quantity * unitPrice * (1 - discountPercent / 100));
}

export function quoteTotals(lines: number[], discountType: string, discountPercent: number, discountAmount: number, vatRate: number) {
  const subtotal = lines.reduce((a, b) => a + b, 0);
  const discount = discountType === "amount" ? Math.min(discountAmount, subtotal) : Math.round((subtotal * discountPercent) / 100);
  const taxable = subtotal - discount;
  const tax = Math.round((taxable * vatRate) / 100);
  return { subtotal, discount, tax, grand: taxable + tax };
}
