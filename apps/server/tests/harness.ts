import type { AddressInfo } from "node:net";
import type { ServerMessage } from "@bowling/domain";
import { afterEach, beforeEach, expect, vi } from "vitest";
import { WebSocket } from "ws";
import type { Limits } from "../src/limits.js";
import { type AppServer, createAppServer } from "../src/server.js";
import { createFakeClock } from "./fake-clock.js";

export interface Client {
  send(message: unknown): void;
  sendRaw(raw: string): void;
  next(): Promise<ServerMessage>;
  close(): void;
  closed: Promise<void>;
}

export const FIRST_CODE = "22222";

export const noticeOf = async (client: Client) => {
  let message = await client.next();
  while (message.type === "room") {
    message = await client.next();
  }
  return message;
};

export const useServer = (
  limits: Partial<Limits> = {},
  { trustProxy = false } = {},
) => {
  let server: AppServer;
  let wsUrl: string;
  const sockets: WebSocket[] = [];
  const time = createFakeClock();

  beforeEach(async () => {
    let draws = 0;
    const random = () => (draws++ < 5 ? 0 : Math.random());
    server = createAppServer({
      webRoot: "/nonexistent",
      random,
      clock: time.clock,
      limits,
      trustProxy,
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    wsUrl = `ws://localhost:${(server.address() as AddressInfo).port}/ws`;
  });

  afterEach(async () => {
    for (const socket of sockets.splice(0)) {
      socket.terminate();
    }
    await new Promise((resolve) => server.close(resolve));
  });

  const connect = async (headers: Record<string, string> = {}) => {
    const socket = new WebSocket(wsUrl, { headers });
    sockets.push(socket);
    const inbox: ServerMessage[] = [];
    const waiting: ((message: ServerMessage) => void)[] = [];
    socket.on("message", (data) => {
      const message = JSON.parse(String(data)) as ServerMessage;
      const waiter = waiting.shift();
      if (waiter) {
        waiter(message);
      } else {
        inbox.push(message);
      }
    });
    const closed = new Promise<void>((resolve) =>
      socket.once("close", () => resolve()),
    );
    await new Promise((resolve) => socket.once("open", resolve));
    const client: Client = {
      send: (message) => socket.send(JSON.stringify(message)),
      sendRaw: (raw) => socket.send(raw),
      next: () => {
        const queued = inbox.shift();
        return queued
          ? Promise.resolve(queued)
          : new Promise((resolve) => waiting.push(resolve));
      },
      close: () => socket.close(),
      closed,
    };
    return client;
  };

  const createRoom = async (nickname = "Ana") => {
    const host = await connect();
    host.send({ type: "create", nickname });
    const message = await host.next();
    if (message.type !== "room") {
      throw new Error(JSON.stringify(message));
    }
    return { host, code: message.room.code, token: message.token };
  };

  const joinRoom = async (code: string, nickname: string) => {
    const bowler = await connect();
    bowler.send({ type: "join", code, nickname });
    await bowler.next();
    return bowler;
  };

  const expectEmpty = async () => {
    await vi.waitFor(() =>
      expect(server.usage()).toEqual({
        rooms: 0,
        connections: 0,
        addresses: 0,
      }),
    );
    expect(time.pending()).toBe(0);
  };

  const expectDestroyed = async (...clients: Client[]) => {
    for (const client of clients) {
      expect(await noticeOf(client)).toEqual({
        type: "closed",
        reason: "ROOM_CLOSED",
      });
      await client.closed;
    }
    await expectEmpty();
  };

  return {
    connect,
    expectEmpty,
    expectDestroyed,
    createRoom,
    joinRoom,
    time,
    usage: () => server.usage(),
    shutdown: () => server.shutdown(),
  };
};
