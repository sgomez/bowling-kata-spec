FROM node:22-slim AS base
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/domain/package.json packages/domain/
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/

FROM base AS build
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY tsconfig.base.json ./
COPY packages/domain packages/domain
COPY apps/web apps/web
RUN pnpm build

FROM base AS prod-deps
RUN pnpm install --frozen-lockfile --ignore-scripts --prod --filter @bowling/server...

FROM node:22-slim
ENV NODE_ENV=production TRUST_PROXY=1
WORKDIR /app
COPY --from=prod-deps /app ./
COPY packages/domain/src packages/domain/src
COPY apps/server/src apps/server/src
COPY --from=build /app/apps/web/dist apps/web/dist
USER node
WORKDIR /app/apps/server
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch(`http://127.0.0.1:${process.env.PORT ?? 3000}/health`).then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node", "--import", "tsx", "src/main.ts"]
