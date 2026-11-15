import { readFile, stat } from "node:fs/promises";
import { createServer, type Server, type ServerResponse } from "node:http";
import { extname, join, resolve, sep } from "node:path";
import { type Clock, systemClock } from "./clock.js";
import { DEFAULT_LIMITS, type Limits } from "./limits.js";
import { attachRoomSocket } from "./room-socket.js";

interface AppServerOptions {
  webRoot: string;
  random?: () => number;
  clock?: Clock;
  limits?: Partial<Limits>;
}

export type AppServer = Server & {
  usage(): { rooms: number; connections: number; addresses: number };
  shutdown(): Promise<void>;
};

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2",
};

const isFile = async (path: string): Promise<boolean> =>
  (await stat(path).catch(() => null))?.isFile() ?? false;

const sendFile = async (response: ServerResponse, path: string) => {
  const contentType =
    CONTENT_TYPES[extname(path)] ?? "application/octet-stream";
  response.writeHead(200, { "content-type": contentType });
  response.end(await readFile(path));
};

export const createAppServer = ({
  webRoot,
  random = Math.random,
  clock = systemClock,
  limits = {},
}: AppServerOptions): AppServer => {
  const root = resolve(webRoot);
  const indexHtml = join(root, "index.html");

  const resolveAsset = async (url: string): Promise<string> => {
    const { pathname } = new URL(url, "http://localhost");
    const path = join(root, decodeURIComponent(pathname));
    const insideRoot = path.startsWith(root + sep);
    return insideRoot && (await isFile(path)) ? path : indexHtml;
  };

  const server = createServer(async (request, response) => {
    const url = request.url ?? "/";
    if (url === "/health") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ status: "ok" }));
      return;
    }
    await sendFile(response, await resolveAsset(url));
  });
  const rooms = attachRoomSocket(server, random, clock, {
    ...DEFAULT_LIMITS,
    ...limits,
  });
  return Object.assign(server, {
    usage: rooms.usage,
    shutdown: () =>
      new Promise<void>((resolve) => {
        rooms.shutdown();
        server.close(() => resolve());
        server.closeIdleConnections();
      }),
  });
};
