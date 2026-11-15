import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createAppServer } from "../src/server.js";

const INDEX_HTML = "<!doctype html><title>Bolos</title>";
const APP_JS = "console.log('bolos');";

let webRoot: string;
let server: Server;
let baseUrl: string;

beforeAll(async () => {
  webRoot = await mkdtemp(join(tmpdir(), "bowling-web-"));
  await writeFile(join(webRoot, "index.html"), INDEX_HTML);
  await mkdir(join(webRoot, "assets"));
  await writeFile(join(webRoot, "assets", "app.js"), APP_JS);
  server = createAppServer({ webRoot });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
  await rm(webRoot, { recursive: true });
});

describe("app server", () => {
  it("answers the health check", async () => {
    const response = await fetch(`${baseUrl}/health`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  it("serves the web app's index.html at the root", async () => {
    const response = await fetch(baseUrl);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/^text\/html/);
    expect(await response.text()).toBe(INDEX_HTML);
  });

  it("serves the web app's built assets", async () => {
    const response = await fetch(`${baseUrl}/assets/app.js`);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/^text\/javascript/);
    expect(await response.text()).toBe(APP_JS);
  });

  it("falls back to index.html for unknown paths such as a Room Code", async () => {
    const response = await fetch(`${baseUrl}/K7MPQ`);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe(INDEX_HTML);
  });

  it("never serves files outside the web app", async () => {
    const response = await fetch(`${baseUrl}/..%2f..%2fetc%2fpasswd`);

    expect(await response.text()).toBe(INDEX_HTML);
  });
});
