"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getUsersMe, postAuthFirebaseLogin } from "../api/endpoints";
import type { UserResponse } from "../api/schema";
import { ApiError } from "../api/http";
import { clearTokens, getAccessToken, isTokenExpired, onSessionExpired, refreshAccessToken, setTokens } from "./tokenManager";
import {
  firebaseSignInWithEmail,
  firebaseSignUpWithEmail,
  firebaseSignInWithGoogle,
  firebaseSignOut,
} from "../firebase/client";
import { useToast } from "../toast/ToastProvider";
import { tr } from "../i18n/dict";

export function formatAuthError(error: unknown): string {
  const e = error as { code?: string; message?: string } | null;
  const code = e?.code || e?.message || "";
  const t = tr().auth;
  if (typeof code !== "string") return t.unknown;
  if (code.includes("auth/invalid-credential") || code.includes("auth/wrong-password"))
    return t.badCredentials;
  if (code.includes("auth/user-not-found")) return t.userNotFound;
  if (code.includes("auth/email-already-in-use")) return t.emailInUse;
  if (code.includes("auth/weak-password")) return t.weakPassword;
  if (code.includes("auth/invalid-email")) return t.invalidEmail;
  if (code.includes("auth/popup-closed-by-user")) return t.popupClosed;
  if (code.includes("auth/too-many-requests")) return t.tooMany;
  if (code.includes("auth/network-request-failed"))
    return t.network;
  return e?.message || t.failed;
}

interface AuthContextType {
  token: string | null;
  user: UserResponse | null;
  isLoading: boolean;
  error: string | null;
  loginWithEmail: (email: string, pass: string) => Promise<boolean>;
  registerWithEmail: (email: string, pass: string) => Promise<{ success: boolean; message: string }>;
  loginWithGoogle: () => Promise<boolean>;
  loginWithAccessToken: (token: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (u: UserResponse) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () =>
      onSessionExpired(() => {
        qc.clear();
        setToken(null);
        setUser(null);
        toast.info(tr().auth.sessionExpired);
      }),
    [qc, toast],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let stored = getAccessToken();
      if (!stored) return setIsLoading(false);
      try {
        if (isTokenExpired(stored)) stored = (await refreshAccessToken()) ?? stored;
        if (cancelled) return;
        setToken(stored);
        const me = await getUsersMe();
        if (!cancelled) setUser(me);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          clearTokens();
          if (!cancelled) setToken(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const finishLogin = useCallback(
    async (access: string, refresh?: string, me?: UserResponse) => {
      setTokens(access, refresh);
      qc.clear();
      setToken(access);
      setUser(me ?? (await getUsersMe()));
    },
    [qc],
  );

  const exchangeFirebaseToken = useCallback(
    async (idToken: string) => {
      const res = await postAuthFirebaseLogin({ idToken });
      await finishLogin(res.accessToken, res.refreshToken);
    },
    [finishLogin],
  );

  const run = useCallback(async <T,>(fn: () => Promise<T>, onFail: (msg: string) => T): Promise<T> => {
    setIsLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (err) {
      const msg = formatAuthError(err);
      setError(msg);
      return onFail(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      token,
      user,
      isLoading,
      error,
      loginWithEmail: (email, pass) =>
        run<boolean>(async () => {
          await exchangeFirebaseToken(await firebaseSignInWithEmail(email, pass));
          return true;
        }, () => false),
      registerWithEmail: (email, pass) =>
        run<{ success: boolean; message: string }>(
          async () => {
            const fbUser = await firebaseSignUpWithEmail(email, pass);
            await exchangeFirebaseToken(await fbUser.getIdToken());
            return {
              success: true,
              message: tr().auth.signedUp,
            };
          },
          (message) => ({ success: false, message }),
        ),
      loginWithGoogle: () =>
        run<boolean>(async () => {
          await exchangeFirebaseToken(await firebaseSignInWithGoogle());
          return true;
        }, () => false),
      loginWithAccessToken: (raw) =>
        run<boolean>(async () => {
          const t = raw.trim();
          setTokens(t);
          try {
            await finishLogin(t);
          } catch (err) {
            clearTokens();
            throw err;
          }
          return true;
        }, () => false),
      logout: async () => {
        try {
          await firebaseSignOut();
        } catch {
          /* chưa đăng nhập Firebase thì bỏ qua */
        }
        clearTokens();
        qc.clear();
        setToken(null);
        setUser(null);
      },
      setUser,
      clearError: () => setError(null),
    }),
    [token, user, isLoading, error, run, exchangeFirebaseToken, finishLogin, qc],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
