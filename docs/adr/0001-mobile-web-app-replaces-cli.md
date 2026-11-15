# Mobile web app with a WebSocket server replaces the CLI

Bowling moves from a terminal REPL to an online, mobile-only web app where several Bowlers play together in a Room. One Node process serves the built SPA and a WebSocket endpoint (`ws` on `node:http`); the repo becomes a pnpm workspace (`packages/domain`, `apps/server`, `apps/web`) so DOM and Node types never mix. The CLI, the Notation parser, the ASCII scorecard and Game undo are removed rather than kept as a second adapter: nobody would use them and they would only add maintenance.

## Considered Options

- Socket.IO or a web framework (Fastify, Hono): rejected; a single server with a handful of message types doesn't need rooms-as-a-service, fallbacks or routing.
- A single package with `src/server` and `src/web`: rejected; one tsconfig would have to mix `lib: DOM` with Node types.
