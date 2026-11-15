import { describe, expect, it } from "vitest";
import { useServer } from "./harness.js";

const { connect, createRoom, joinRoom } = useServer();

describe("WebSocket Lobby refuses", () => {
  it.each([
    ["an unknown code", { code: "ZZZZZ", nickname: "Bea" }, "UNKNOWN_ROOM"],
    ["a malformed code", { code: "0", nickname: "Bea" }, "UNKNOWN_ROOM"],
    ["a taken nickname", { nickname: "ana" }, "NICKNAME_TAKEN"],
    ["an invalid nickname", { nickname: " " }, "NICKNAME_INVALID"],
  ])("%s", async (_, join, error) => {
    const { code } = await createRoom();
    const bea = await connect();

    bea.send({ type: "join", code, ...join });

    expect(await bea.next()).toEqual({ type: "error", error });
  });

  it("an invalid nickname for a new Room", async () => {
    const host = await connect();

    host.send({ type: "create", nickname: "" });

    expect(await host.next()).toEqual({
      type: "error",
      error: "NICKNAME_INVALID",
    });
  });

  it("a full Room", async () => {
    const { code } = await createRoom();
    for (const nickname of ["Bea", "Carlos", "Dani", "Eva", "Fer"]) {
      await joinRoom(code, nickname);
    }
    const gema = await connect();

    gema.send({ type: "join", code, nickname: "Gema" });

    expect(await gema.next()).toEqual({ type: "error", error: "ROOM_FULL" });
  });

  it("joining once the Games started", async () => {
    const { host, code } = await createRoom();
    host.send({ type: "start" });
    await host.next();
    const bea = await connect();

    bea.send({ type: "join", code, nickname: "Bea" });

    expect(await bea.next()).toEqual({ type: "error", error: "GAMES_STARTED" });
  });

  it("a start from a Bowler who isn't Host", async () => {
    const { code } = await createRoom();
    const bea = await joinRoom(code, "Bea");

    bea.send({ type: "start" });

    expect(await bea.next()).toEqual({ type: "error", error: "NOT_HOST" });
  });

  it("a start from outside any Room", async () => {
    const stranger = await connect();

    stranger.send({ type: "start" });

    expect(await stranger.next()).toEqual({
      type: "error",
      error: "NOT_IN_ROOM",
    });
  });

  it("creating or joining while already in a Room", async () => {
    const { host, code } = await createRoom();

    host.send({ type: "join", code, nickname: "Otra" });
    expect(await host.next()).toEqual({
      type: "error",
      error: "ALREADY_IN_ROOM",
    });
    host.send({ type: "create", nickname: "Otra" });
    expect(await host.next()).toEqual({
      type: "error",
      error: "ALREADY_IN_ROOM",
    });
  });

  it.each([
    ["non-JSON", "hola"],
    ["an unknown type", JSON.stringify({ type: "dance" })],
    ["missing fields", JSON.stringify({ type: "join", code: "22222" })],
  ])("%s messages", async (_, raw) => {
    const client = await connect();

    client.sendRaw(raw);

    expect(await client.next()).toEqual({
      type: "error",
      error: "INVALID_MESSAGE",
    });
  });
});
