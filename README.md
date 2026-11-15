# bowling-kata-spec

Online multiplayer bowling for phones. pnpm workspace: `packages/domain`, `apps/server`, `apps/web`.

- `pnpm dev`: server (port 8787) and Vite dev server, reachable on the local network.
- `pnpm build && pnpm start`: server serving the built web app.
- `pnpm check`: lint, typecheck, size, architecture, knip and tests with coverage.

## Container image

```sh
docker build -t bowling-kata .
docker run --rm -p 8787:8787 bowling-kata
```

The app listens on `PORT` (default 8787): `docker run --rm -e PORT=3000 -p 3000:3000 bowling-kata`. The image has a healthcheck on `GET /health`.
