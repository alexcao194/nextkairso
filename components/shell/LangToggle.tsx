"use client";

import { useLocale } from "@/lib/i18n";

export function LangToggle() {
  const { lang, setLang } = useLocale();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === "vi" ? "en" : "vi")}
      aria-label={lang === "vi" ? "Switch to English" : "Chuyển sang tiếng Việt"}
      className="flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-[11px] font-semibold tracking-wide text-ink-muted hover:bg-hover hover:text-ink"
    >
      {lang === "vi" ? "EN" : "VI"}
    </button>
  );
}
