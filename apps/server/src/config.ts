import { fileURLToPath } from "node:url";

interface ServerConfig {
  port: number;
  host: string;
  webRoot: string;
}

export const readServerConfig = (env: NodeJS.ProcessEnv): ServerConfig => ({
  port: Number(env.PORT ?? 8787),
  host: env.HOST ?? "0.0.0.0",
  webRoot:
    env.WEB_ROOT ?? fileURLToPath(new URL("../../web/dist", import.meta.url)),
});
