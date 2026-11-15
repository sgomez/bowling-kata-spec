import type { AddressInfo } from "node:net";
import type { ServerMessage } from "@bowling/domain";
import { afterEach, beforeEach } from "vitest";
import { WebSocket } from "ws";
import { createAppServer } from "../src/server.js";
import { createFakeClock } from "./fake-clock.js";

export interface Client {
  send(message: unknown): void;
  sendRaw(raw: string): void;
  next(): Promise<ServerMessage>;
  close(): void;
}

export const FIRST_CODE = "22222";

export const useServer = () => {
  let server: ReturnType<typeof createAppServer>;
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

  const connect = async (): Promise<Client> => {
    const socket = new WebSocket(wsUrl);
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
    await new Promise((resolve) => socket.once("open", resolve));
    return {
      send: (message) => socket.send(JSON.stringify(message)),
      sendRaw: (raw) => socket.send(raw),
      next: () => {
        const queued = inbox.shift();
        return queued
          ? Promise.resolve(queued)
          : new Promise((resolve) => waiting.push(resolve));
      },
      close: () => socket.close(),
    };
  };

  const createRoom = async (nickname = "Ana") => {
    const host = await connect();
    host.send({ type: "create", nickname });
    const message = await host.next();
    if (message.type !== "room") {
      throw new Error(message.type);
    }
    return { host, code: message.room.code, token: message.token };
  };

  const joinRoom = async (code: string, nickname: string) => {
    const bowler = await connect();
    bowler.send({ type: "join", code, nickname });
    await bowler.next();
    return bowler;
  };

  return { connect, createRoom, joinRoom, time };
};
