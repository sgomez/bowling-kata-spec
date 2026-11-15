import { mkdtemp, rm, writeFile } from "node:fs/promises";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createAppServer } from "../src/server.js";

const INDEX_HTML = '<meta property="og:image" content="__ORIGIN__/og.png" />';

let webRoot: string;
const servers: Server[] = [];

const start = async (trustProxy: boolean) => {
  const server = createAppServer({ webRoot, trustProxy });
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  return `http://localhost:${(server.address() as AddressInfo).port}`;
};

const page = async (url: string, headers: Record<string, string> = {}) =>
  (await fetch(url, { headers })).text();

beforeAll(async () => {
  webRoot = await mkdtemp(join(tmpdir(), "bowling-web-"));
  await writeFile(join(webRoot, "index.html"), INDEX_HTML);
});

afterAll(async () => {
  for (const server of servers) {
    await new Promise((resolve) => server.close(resolve));
  }
  await rm(webRoot, { recursive: true });
});

describe("the share preview", () => {
  it("points at the address the page was asked on", async () => {
    const url = await start(false);

    expect(await page(`${url}/K7MPQ`)).toContain(`content="${url}/og.png"`);
  });

  it("points at the public address behind a trusted proxy", async () => {
    const url = await start(true);
    const html = await page(url, {
      "x-forwarded-proto": "https",
      "x-forwarded-host": "bolos.example",
    });

    expect(html).toContain('content="https://bolos.example/og.png"');
  });

  it("ignores forwarded addresses without a trusted proxy", async () => {
    const url = await start(false);
    const html = await page(url, { "x-forwarded-host": "bolos.example" });

    expect(html).toContain(`content="${url}/og.png"`);
  });

  it("never writes a forged address into the page", async () => {
    const url = await start(true);
    const html = await page(url, {
      "x-forwarded-host": '"><script>alert(1)</script>',
    });

    expect(html).not.toContain("<script>");
    expect(html).toContain('content="/og.png"');
  });
});
