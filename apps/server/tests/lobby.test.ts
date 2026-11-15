import { describe, expect, it } from "vitest";
import { FIRST_CODE, useServer } from "./harness.js";

const { connect, createRoom, joinRoom } = useServer();

describe("WebSocket Lobby", () => {
  it("creates a Room with the creator as Host", async () => {
    const host = await connect();

    host.send({ type: "create", nickname: " Ana " });

    const message = await host.next();
    expect(message).toMatchObject({
      type: "room",
      you: expect.any(String),
      room: {
        code: FIRST_CODE,
        phase: "lobby",
        hostId: expect.any(String),
        bowlers: [{ id: expect.any(String), nickname: "Ana" }],
      },
    });
    if (message.type === "room") {
      expect(message.room.hostId).toBe(message.you);
    }
  });

  it("gives a new Room a code no other Room uses", async () => {
    const first = await createRoom();
    const second = await createRoom("Bea");

    expect(first.code).toBe(FIRST_CODE);
    expect(second.code).not.toBe(FIRST_CODE);
  });

  it("lets a Bowler join by code, ignoring case, and tells everyone", async () => {
    const { host, code } = await createRoom();
    const bea = await connect();

    bea.send({ type: "join", code: code.toLowerCase(), nickname: "Bea" });

    const forBea = await bea.next();
    const forHost = await host.next();
    expect(forBea.type === "room" && forBea.room.bowlers).toMatchObject([
      { id: expect.any(String), nickname: "Ana" },
      { id: expect.any(String), nickname: "Bea" },
    ]);
    expect(forHost.type === "room" && forHost.room).toEqual(
      forBea.type === "room" && forBea.room,
    );
    expect(forBea.type === "room" && forBea.you).not.toBe(
      forHost.type === "room" && forHost.you,
    );
  });

  it("tells everyone when the Host starts the Games", async () => {
    const { host, code } = await createRoom();
    const bea = await joinRoom(code, "Bea");
    await host.next();

    host.send({ type: "start" });

    expect(await host.next()).toMatchObject({ room: { phase: "playing" } });
    expect(await bea.next()).toMatchObject({ room: { phase: "playing" } });
  });

  it("stops sending to Bowlers whose connection closed", async () => {
    const { host, code } = await createRoom();
    host.close();
    const bea = await connect();

    bea.send({ type: "join", code, nickname: "Bea" });

    expect(await bea.next()).toMatchObject({ type: "room" });
  });
});
