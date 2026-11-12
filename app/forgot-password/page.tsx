"use client";

import React, { useState } from "react";
import Link from "next/link";
import { IconChevronLeft, IconSend } from "@/components/icons";
import { firebaseSendPasswordReset } from "@/lib/firebase/client";
import { formatAuthError } from "@/lib/auth/AuthContext";
import { useT } from "@/lib/i18n";

export default function ForgotPasswordPage() {
const t = useT();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setErrorMsg(null);
    setIsLoading(true);

    try {
      await firebaseSendPasswordReset(email.trim());
      setIsSubmitted(true);
    } catch (err: any) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6">
      <div className="w-full max-w-[420px] rounded-xl border border-line bg-surface p-8 shadow-xl space-y-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink cursor-pointer"
        >
          <IconChevronLeft size={14} />
          {t.forgot.back}
        </Link>

        <div>
          <div className="flex size-10 items-center justify-center rounded-lg bg-accent/15 text-accent font-bold mb-3">
            🔐
          </div>
          <h1 className="text-xl font-bold text-ink">{t.forgot.title}</h1>
          <p className="text-xs text-ink-muted mt-1 leading-relaxed">
            {t.forgot.desc}
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-xs text-danger font-medium animate-in fade-in">
            {errorMsg}
          </div>
        )}

        {isSubmitted ? (
          <div className="rounded-lg border border-success/30 bg-success/10 p-4 space-y-2">

            <div className="text-xs font-semibold text-success">{t.forgot.sent}</div>
            <p className="text-xs text-ink-2 leading-relaxed">
              {t.forgot.checkInboxPrefix} <strong>{email}</strong> {t.forgot.checkInboxSuffix}
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-block text-xs font-medium text-accent hover:underline cursor-pointer"
              >
                {t.forgot.backToLogin}
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1.5">{t.forgot.email}</label>
              <input
                type="email"
                required
                autoFocus
                placeholder={t.login.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-surface border border-line rounded-lg text-ink placeholder:text-ink-placeholder outline-none focus:border-accent"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              <IconSend size={13} />
              {isLoading ? t.forgot.sending : t.forgot.send}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
