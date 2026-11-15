# bowling-kata-spec

Online multiplayer bowling for phones. pnpm workspace: `packages/domain`, `apps/server`, `apps/web`.

- `pnpm dev`: server and Vite dev server, reachable on the local network. The server listens on `PORT` (default 8787 in dev) and Vite proxies to it.
- `pnpm build && pnpm start`: server serving the built web app.
- `pnpm check`: lint, typecheck, size, architecture, knip and tests with coverage.

## Container image

```sh
docker build -t bowling-kata .
docker run --rm -p 3000:3000 bowling-kata
```

The app listens on `PORT` (default 3000): `docker run --rm -e PORT=8080 -p 8080:8080 bowling-kata`. The image has a healthcheck on `GET /health`.

`TRUST_PROXY=1` takes the client address for the per-address connection cap from the last `X-Forwarded-For` entry, which the reverse proxy (Coolify's) appends; otherwise the socket address is used. The image sets it; run with `-e TRUST_PROXY=0` when no proxy sits in front, or clients can spoof their address.
