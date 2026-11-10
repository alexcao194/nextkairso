# Kairso Web

Bản web của Kairso (Next.js 16 App Router, React 19, Tailwind 4, TanStack Query). Dùng chung backend `gokairso` với app Flutter.

## Chạy

```bash
npm install
cp .env.example .env.local   # chỉnh NEXT_PUBLIC_BASE_URL và APP_SIGNATURE_SECRET
npm run dev                   # http://localhost:3000
npm run typecheck
npm run build
```

Biến môi trường chính: `NEXT_PUBLIC_BASE_URL` (URL API, cũng dùng để suy ra WebSocket `/ws`),
`APP_SIGNATURE_SECRET` (bí mật ký `X-App-Token`, chỉ dùng phía server), cấu hình Firebase/Google ở `.env.example`.

## Cập nhật client API

Khi backend đổi swagger:

```bash
(cd ../gokairso && make swagger)
npm run gen:api
```

Xem `AGENTS.md` (kiến trúc, quy ước) và `docs/KAIRSO-UI-SPEC.md` (thiết kế).
