import { describe, expect, it } from "vitest";
import { errorMessage } from "../src/messages.js";

describe("error messages", () => {
  it.each([
    ["ROOM_FULL", "La sala está completa: ya hay seis jugadores."],
    ["UNKNOWN_ROOM", "No existe ninguna sala con ese código."],
    ["NICKNAME_TAKEN", "Ese apodo ya está cogido en la sala. Elige otro."],
    ["NICKNAME_INVALID", "El apodo debe tener entre 1 y 16 caracteres."],
    ["GAMES_STARTED", "La partida ya ha empezado; no se puede entrar."],
  ] as const)("explain %s in Spanish", (code, message) => {
    expect(errorMessage(code)).toBe(message);
  });

  it.each([
    "NOT_HOST",
    "INVALID_MESSAGE",
    "ALREADY_IN_ROOM",
    "NOT_IN_ROOM",
    "TOO_MANY_ROOMS",
    "TOO_MANY_CONNECTIONS",
    "MESSAGE_TOO_LARGE",
    "TOO_MANY_MESSAGES",
  ] as const)("cover %s too", (code) => {
    expect(errorMessage(code)).not.toBe("");
  });
});
