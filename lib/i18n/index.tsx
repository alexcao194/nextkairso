"use client";

import { createContext, Fragment, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { patchUsersMe } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth/AuthContext";
import { dict } from "./dict";
import { setCurrentLang, type Lang } from "./state";

export type { Lang } from "./state";
export { tr } from "./dict";
export { dateLocale } from "./state";

const STORAGE_KEY = "kairso-lang";

function normalize(value?: string | null): Lang {
  return value === "en" ? "en" : "vi";
}

type LocaleContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const { user, setUser } = useAuth();
  const [lang, setLangState] = useState<Lang>("vi");
  const adoptedFromServer = useRef(false);
  // Keep non-React formatters in step with the language being rendered.
  setCurrentLang(lang);

  // Initial language from localStorage (per-browser convenience).
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setLangState(normalize(stored));
    } catch {
      /* ignore */
    }
  }, []);

  // Reflect on <html lang> for accessibility.
  useEffect(() => {
    try {
      document.documentElement.lang = lang;
    } catch {
      /* ignore */
    }
  }, [lang]);

  // When the signed-in user loads, adopt their stored locale (the server is the
  // source of truth across devices). Done once per session.
  useEffect(() => {
    if (!user?.locale || adoptedFromServer.current) return;
    adoptedFromServer.current = true;
    const serverLang = normalize(user.locale);
    setLangState(serverLang);
    try {
      localStorage.setItem(STORAGE_KEY, serverLang);
    } catch {
      /* ignore */
    }
  }, [user?.locale]);

  const setLang = (next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    if (user && user.locale !== next) {
      patchUsersMe({ locale: next })
        .then((updated) => setUser(updated))
        .catch(() => {
          /* keep local change even if the sync fails */
        });
    }
  };

  // Remount the subtree on language change so every label (including those
  // read by plain functions via tr()) re-renders in the new language.
  return (
    <LocaleContext.Provider value={{ lang, setLang }}>
      <Fragment key={lang}>{children}</Fragment>
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}

export function useT() {
  return dict[useLocale().lang];
}
