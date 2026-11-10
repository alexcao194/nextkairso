"use client";

import "./globals.css";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="vi">
      <body>
        <div style={{ display: "flex", minHeight: "100dvh", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24, textAlign: "center", background: "#F7F7F8" }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "#18181B" }}>Ứng dụng gặp sự cố</h1>
          <p style={{ maxWidth: 380, fontSize: 14, color: "#52525B" }}>
            Rất tiếc, có lỗi nghiêm trọng xảy ra. Vui lòng tải lại trang.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{ marginTop: 8, height: 32, padding: "0 16px", borderRadius: 6, border: "none", background: "#4F46E5", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
          >
            Tải lại
          </button>
        </div>
      </body>
    </html>
  );
}
