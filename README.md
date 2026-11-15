# bowling-kata-spec

Online multiplayer bowling for phones. pnpm workspace: `packages/domain`, `apps/server`, `apps/web`.

- `pnpm dev`: server (port 8787) and Vite dev server, reachable on the local network.
- `pnpm build && pnpm start`: server serving the built web app.
- `pnpm check`: lint, typecheck, size, architecture, knip and tests with coverage.
