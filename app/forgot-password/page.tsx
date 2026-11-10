"use client";

import React, { useState } from "react";
import Link from "next/link";
import { IconChevronLeft, IconSend } from "@/components/icons";
import { firebaseSendPasswordReset } from "@/lib/firebase/client";
import { formatAuthError } from "@/lib/auth/AuthContext";

export default function ForgotPasswordPage() {
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
          Quay lại đăng nhập
        </Link>

        <div>
          <div className="flex size-10 items-center justify-center rounded-lg bg-accent/15 text-accent font-bold mb-3">
            🔐
          </div>
          <h1 className="text-xl font-bold text-ink">Khôi phục mật khẩu</h1>
          <p className="text-xs text-ink-muted mt-1 leading-relaxed">
            Nhập địa chỉ email đăng ký tài khoản Kairso. Chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu cho bạn.
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-xs text-danger font-medium animate-in fade-in">
            {errorMsg}
          </div>
        )}

        {isSubmitted ? (
          <div className="rounded-lg border border-success/30 bg-success/10 p-4 space-y-2">

            <div className="text-xs font-semibold text-success">Đã gửi email khôi phục!</div>
            <p className="text-xs text-ink-2 leading-relaxed">
              Vui lòng kiểm tra hộp thư đến của <strong>{email}</strong> và làm theo hướng dẫn để thiết lập mật khẩu mới.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-block text-xs font-medium text-accent hover:underline cursor-pointer"
              >
                Trở về trang Đăng nhập
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1.5">Email tài khoản *</label>
              <input
                type="email"
                required
                autoFocus
                placeholder="ten.ban@kairso.com"
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
              {isLoading ? "Đang gửi liên kết..." : "Gửi liên kết khôi phục"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
