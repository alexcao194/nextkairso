# Kairso — Web

The web front end for **Kairso**, a platform for managing workspaces, projects, KPIs, attendance and initiatives for teams. This repository is the Next.js app. It also proxies REST calls to the backend so the signing secret never reaches the browser.

- 🌐 Website & docs: **https://home.kairso.com** (see the [Install & self-host guide](https://home.kairso.com/install))
- 🚀 Hosted app: **https://app.kairso.com**
- 🧩 Backend: **[kairso-server](https://gitlab.alexcao.tech/kairso/gokairso)** — the other half of the stack
- 🐳 Image: **[`alexcao194/kairso-web`](https://hub.docker.com/r/alexcao194/kairso-web)** (multi-arch `amd64` + `arm64`)

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19 + TypeScript |
| Data | React Query + a generated, type-safe API client |
| Auth | Firebase |
| API access | Same-origin proxy at `/api/proxy` that signs `X-App-Token` (HMAC) |

The dev server runs on `:3000`.

---

## Run from source (development)

### Prerequisites
- [Node.js 20+](https://nodejs.org/) and npm
- A running **backend** — either a local [`kairso-server`](https://gitlab.alexcao.tech/kairso/gokairso) or the hosted one at `https://app.kairso.com`
- A **Firebase project** for authentication

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Create a local env file
cp .env.example .env.local
#    point NEXT_PUBLIC_BASE_URL / NEXT_PUBLIC_WS_URL at your backend,
#    and set APP_SIGNATURE_SECRET to match the backend's APP_TOKEN_SECRET

# 3. Generate the API client from the backend's Swagger
#    (by default it reads ../gokairso/docs/swagger.json — clone both repos side by side)
npm run gen:api

# 4. Start the dev server
npm run dev
```

Open http://localhost:3000.

### Scripts

| Script | Does |
|---|---|
| `npm run dev` | Start the dev server (`:3000`) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run gen:api` | Regenerate `lib/api/*` from the backend Swagger |
| `npm run typecheck` | `tsc --noEmit` |

### Key environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_BASE_URL` | Backend REST base the proxy forwards to |
| `NEXT_PUBLIC_WS_URL` | Realtime WebSocket URL |
| `APP_SIGNATURE_SECRET` | HMAC shared with the backend — must match its `APP_TOKEN_SECRET` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` / `SERVER_CLIENT_ID` | Google sign-in |

---

## Run with Docker (production / self-host)

The web image is built once and configured **at runtime** — the same image runs on any domain without rebuilding. On startup an entrypoint writes `/env-config.js` from environment variables, so Firebase config and the WebSocket origin are injected when the container starts, not baked into the bundle.

It pairs with `kairso-server`, so run the whole stack with the self-host bundle in the backend repo's [`deploy/selfhost`](https://gitlab.alexcao.tech/kairso/gokairso/-/tree/main/deploy/selfhost):

```bash
cd deploy/selfhost
cp .env.example .env         # fill in secrets + Firebase
docker compose up -d
```

Then open `http://localhost:8080` (or your `PUBLIC_URL`). A single nginx entry point routes everything on one origin:

- `/` → this web app
- `/ws` → `kairso-server` (realtime WebSocket)
- `/cdn/` → object storage (files/images) when using the bundled MinIO

See the [Install & self-host guide](https://home.kairso.com/install) for the full walkthrough, HTTPS setup and bring-your-own database/storage options.
