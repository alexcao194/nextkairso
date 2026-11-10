#!/bin/sh
set -e

# Sinh cấu hình CLIENT lúc chạy từ biến môi trường → một image web dựng sẵn chạy
# được với Firebase/WS của từng người tự host mà KHÔNG phải build lại. API đi
# same-origin qua /api/proxy; WS same-origin trừ khi đặt NEXT_PUBLIC_WS_URL.
cat > /app/public/env-config.js <<EOF
window.__KAIRSO_ENV__ = {
  firebaseApiKey: "${NEXT_PUBLIC_FIREBASE_API_KEY:-}",
  firebaseAuthDomain: "${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:-}",
  firebaseProjectId: "${NEXT_PUBLIC_FIREBASE_PROJECT_ID:-}",
  firebaseStorageBucket: "${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:-}",
  firebaseMessagingSenderId: "${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:-}",
  firebaseAppId: "${NEXT_PUBLIC_FIREBASE_APP_ID:-}",
  wsUrl: "${NEXT_PUBLIC_WS_URL:-}"
};
EOF

exec node server.js
