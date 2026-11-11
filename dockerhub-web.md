# kairso-web

The web app for **Kairso** — a workspace, project, KPI, attendance and initiative management platform. This image is the Next.js front end and also proxies REST calls to the backend so the signing secret never reaches the browser.

- **Multi-arch:** `linux/amd64`, `linux/arm64`
- **Tags:** `latest`, and a version tag per release (e.g. `v0.0.1`)

## Not a standalone image

`kairso-web` is one half of a stack (the other is [`alexcao194/kairso-server`](https://hub.docker.com/r/alexcao194/kairso-server)). Run the whole stack with the self-host bundle:

```bash
# in deploy/selfhost
cp .env.example .env         # fill in secrets + Firebase
docker compose up -d
```

Then open `http://localhost:8080` (or your `PUBLIC_URL`).

## Runtime configuration

This image is built once and configured **at runtime** — the same image runs on any domain without rebuilding. On startup an entrypoint writes `/env-config.js` from environment variables, so Firebase config and the WebSocket origin are injected when the container starts, not baked into the bundle.

## Key environment variables

| Variable | Purpose |
|---|---|
| `APP_TOKEN_SECRET` | HMAC shared with the backend — must match `kairso-server` |
| `NEXT_PUBLIC_BASE_URL` | Backend REST base the proxy forwards to |
| `FIREBASE_API_KEY` / `FIREBASE_AUTH_DOMAIN` / `FIREBASE_PROJECT_ID` / `FIREBASE_APP_ID` / `FIREBASE_MESSAGING_SENDER_ID` / `FIREBASE_STORAGE_BUCKET` | Firebase client config for sign-in |

## Architecture

A single nginx entry point routes everything on one origin:

- `/` → this web app
- `/ws` → `kairso-server` (realtime WebSocket)
- `/cdn/` → object storage (files/images) when using the bundled MinIO

See the **Install & self-host** guide for the full walkthrough, HTTPS setup and bring-your-own database/storage options.
