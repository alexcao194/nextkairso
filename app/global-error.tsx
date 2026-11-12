"use client";

import "./globals.css";
import { dict } from "@/lib/i18n/dict";

function storedLang(): "vi" | "en" {
  try {
    return localStorage.getItem("kairso-lang") === "en" ? "en" : "vi";
  } catch {
    return "vi";
  }
}

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const lang = typeof window === "undefined" ? "vi" : storedLang();
  const t = dict[lang].errors;
  return (
    <html lang={lang}>
      <body>
        <div style={{ display: "flex", minHeight: "100dvh", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24, textAlign: "center", background: "#F7F7F8" }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "#18181B" }}>{t.crashTitle}</h1>
          <p style={{ maxWidth: 380, fontSize: 14, color: "#52525B" }}>
            {t.crashDesc}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{ marginTop: 8, height: 32, padding: "0 16px", borderRadius: 6, border: "none", background: "#4F46E5", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
          >
            {t.reload}
          </button>
        </div>
      </body>
    </html>
  );
}
