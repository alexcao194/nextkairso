"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { IconZap } from "@/components/icons";
import { useT } from "@/lib/i18n";
import { LangToggle } from "@/components/shell/LangToggle";

function IconGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

export default function LoginPage() {
const t = useT();
  const router = useRouter();
  const {
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    loginWithAccessToken,
    user,
    error,
    clearError,
    logout,
  } = useAuth();

  const isLiveMode = !!user;
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [showTokenInput, setShowTokenInput] = useState(false);
  const [tokenInput, setTokenInput] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    clearError();

    if (mode === "register") {
      if (password.length < 6) {
        setErrorMsg(t.login.pwTooShort);
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg(t.login.pwMismatch);
        return;
      }

      setIsLoading(true);
      const res = await registerWithEmail(email, password);
      setIsLoading(false);

      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          router.push("/");
        }, 1200);
      } else {
        setErrorMsg(res.message);
      }
      return;
    }

    setIsLoading(true);
    const ok = await loginWithEmail(email, password);
    setIsLoading(false);

    if (ok) {
      setSuccessMsg(t.login.loginOk);
      setTimeout(() => {
        router.push("/");
      }, 600);
    } else {
      setErrorMsg(error || t.login.loginFailed);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    clearError();
    setIsLoading(true);
    try {
      const ok = await loginWithGoogle();
      if (ok) {
        setSuccessMsg(t.login.googleOk);
        setTimeout(() => {
          router.push("/");
        }, 600);
      } else {
        setErrorMsg(error || t.login.googleFailed);
      }
    } catch (err: any) {
      setErrorMsg(err.message || t.login.googleError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setErrorMsg(t.login.pasteToken);
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);

    const ok = await loginWithAccessToken(tokenInput.trim());
    setIsLoading(false);

    if (ok) {
      setSuccessMsg(t.login.tokenOk);
      setTimeout(() => {
        router.push("/");
      }, 700);
    } else {
      setErrorMsg(t.login.tokenInvalid);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Left Panel: giới thiệu sản phẩm (ẩn trên màn nhỏ) */}
      <div
        style={{ background: "var(--hero-grad)" }}
        className="relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex lg:w-1/2"
      >
        <span className="pointer-events-none absolute -right-24 -top-24 size-[420px] rounded-full bg-white/12" aria-hidden="true" />
        <span className="pointer-events-none absolute -bottom-32 -left-20 size-[380px] rounded-full bg-white/10" aria-hidden="true" />
        <span className="pointer-events-none absolute bottom-40 right-16 size-24 rounded-3xl bg-white/15 rotate-12" aria-hidden="true" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-white text-lg font-bold text-on-white shadow-md">K</div>
          <span className="text-xl font-bold tracking-tight">KAIRSO</span>
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <h1 className="text-[40px] font-extrabold leading-[1.15] tracking-tight">
            {t.login.heroTitle1}<br />{t.login.heroTitle2}
          </h1>
          <p className="text-[15px] leading-relaxed text-white/90">
            {t.login.heroDesc}
          </p>
          <ul className="grid grid-cols-2 gap-3 pt-2">
            {t.login.features.map(([title, d]) => (
              <li key={title} className="rounded-2xl border border-white/25 bg-white/15 p-3.5 backdrop-blur-sm">
                <p className="text-[13.5px] font-semibold">{title}</p>
                <p className="mt-0.5 text-[12px] text-white/85">{d}</p>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-white/75">{t.login.tagline}</p>
      </div>

      {/* Right Panel: Authentication Card */}
      <div className="flex w-full items-center justify-center bg-surface/80 p-6 backdrop-blur sm:p-12 lg:w-1/2">
        <div className="w-full max-w-[420px] space-y-6">
          {/* Header Mobile Brand */}
          <div className="flex justify-end">
            <LangToggle />
          </div>
          <div className="flex lg:hidden items-center gap-2 mb-4">
            <div style={{ background: "var(--brand-grad)" }} className="flex size-8 items-center justify-center rounded-lg text-white font-bold text-sm shadow-accent">
              K
            </div>
            <span className="text-lg font-bold tracking-tight text-ink">KAIRSO</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-ink tracking-tight">
              {mode === "login" ? t.login.welcomeBack : t.login.createAccount}
            </h2>
            <p className="text-xs text-ink-muted mt-1">
              {mode === "login"
                ? t.login.loginSubtitle
                : t.login.registerSubtitle}
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex rounded-lg border border-line bg-surface-sunken p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMsg(null);
              }}
              className={`flex-1 h-8 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                mode === "login"
                  ? "bg-surface text-ink shadow-xs"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {t.login.signIn}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setErrorMsg(null);
              }}
              className={`flex-1 h-8 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                mode === "register"
                  ? "bg-surface text-ink shadow-xs"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {t.login.signUp}
            </button>
          </div>

          {isLiveMode && user && (
            <div className="rounded-xl border border-accent/30 bg-accent-soft p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-accent-ink">{t.login.activeSession}</span>
                <span className="size-2 rounded-full bg-accent animate-pulse" />
              </div>
              <p className="text-xs text-ink-2">
                {t.login.signedInAs} <strong>{user.email || user.name}</strong>.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="flex-1 h-8 rounded-md bg-accent text-white text-xs font-medium hover:bg-accent-hover transition-colors cursor-pointer"
                >
                  {t.login.enterWorkspace}
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="px-3 h-8 rounded-md border border-line bg-surface hover:bg-hover text-danger text-xs font-medium transition-colors cursor-pointer"
                >
                  {t.login.signOut}
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-xs text-danger font-medium animate-in fade-in">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="rounded-lg border border-success/30 bg-success/10 px-3.5 py-2.5 text-xs text-success font-medium animate-in fade-in">
              {successMsg}
            </div>
          )}

          {/* Google Sign-in */}
          <button
            type="button"
            disabled={isLoading}
            onClick={handleGoogleSignIn}
            className="w-full h-10 rounded-lg border border-line bg-surface hover:bg-hover text-ink text-xs font-medium flex items-center justify-center gap-2.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            <IconGoogle />
            <span>{t.login.google}</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-[11px] text-ink-placeholder uppercase tracking-wider font-medium">
              {t.login.orEmail}
            </span>
            <div className="h-px flex-1 bg-line" />
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">{t.login.workEmail}</label>
              <input
                type="email"
                required
                placeholder={t.login.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-surface border border-line rounded-lg text-ink placeholder:text-ink-placeholder outline-none focus:border-accent"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-ink-2">{t.login.password}</label>
                {mode === "login" && (
                  <Link
                    href="/forgot-password"
                    className="text-[11px] text-accent hover:underline cursor-pointer"
                  >
                    {t.login.forgot}
                  </Link>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-9 px-3 pr-9 text-xs bg-surface border border-line rounded-lg text-ink placeholder:text-ink-placeholder outline-none focus:border-accent font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-ink-placeholder hover:text-ink cursor-pointer"
                  aria-label={t.login.togglePassword}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {mode === "register" && (
              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1">
                  {t.login.confirmPassword}
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-surface border border-line rounded-lg text-ink placeholder:text-ink-placeholder outline-none focus:border-accent font-mono"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 h-10 w-full cursor-pointer rounded-lg bg-(image:--accent-grad) text-xs font-semibold text-white shadow-accent transition-all hover:bg-(image:--accent-grad-hover) disabled:opacity-50"
            >
              {isLoading
                ? t.login.processing
                : mode === "login"
                ? t.login.signIn
                : t.login.createAccount}
            </button>
          </form>

          {/* Quick Access Token option for Dev / Live Backend */}
          <div className="pt-2 border-t border-line">
            <button
              type="button"
              onClick={() => setShowTokenInput(!showTokenInput)}
              className="w-full text-center text-xs text-ink-muted hover:text-accent flex items-center justify-center gap-1.5 cursor-pointer py-1"
            >
              <IconZap size={13} />
              <span>
                {showTokenInput
                  ? t.login.hideToken
                  : t.login.showToken}
              </span>
            </button>

            {showTokenInput && (
              <form onSubmit={handleTokenSubmit} className="mt-3 space-y-2 animate-in fade-in">
                <textarea
                  rows={2}
                  placeholder={t.login.tokenPlaceholder}
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="w-full p-2 text-xs bg-surface-sunken border border-line rounded-lg text-ink font-mono placeholder:text-ink-placeholder outline-none focus:border-accent"
                />
                <p className="text-[11px] text-warning">
                  {t.login.tokenWarning}
                </p>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-8 rounded-md bg-surface border border-accent/40 text-accent hover:bg-accent/10 text-xs font-medium transition-colors cursor-pointer"
                >
                  {t.login.connect}
                </button>
              </form>
            )}
          </div>

          {/* Terms & Privacy */}
          <p className="text-center text-[11px] text-ink-muted leading-relaxed">
            {t.login.termsPrefix}{" "}
            <a href="#" className="text-ink-2 hover:underline">
              {t.login.terms}
            </a>{" "}
            {t.login.and}{" "}
            <a href="#" className="text-ink-2 hover:underline">
              {t.login.privacy}
            </a>
            {t.login.termsSuffix}
          </p>
        </div>
      </div>
    </div>
  );
}
