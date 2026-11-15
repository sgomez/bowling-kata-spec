import type { IncomingMessage } from "node:http";
import type { ErrorCode } from "@bowling/domain";
import type { Clock } from "./clock.js";
import type { Limits } from "./limits.js";

// The proxy appends the real client address last; earlier entries are client-supplied.
export const addressOf = (
  request: IncomingMessage,
  trustProxy: boolean,
): string => {
  const forwarded = trustProxy ? request.headers["x-forwarded-for"] : "";
  const last = String(forwarded ?? "")
    .split(",")
    .at(-1)
    ?.trim();
  return last || (request.socket.remoteAddress ?? "");
};

export const createAddressBook = (max: number) => {
  const counts = new Map<string, number>();
  return {
    admit(address: string) {
      const count = counts.get(address) ?? 0;
      if (count >= max) {
        return false;
      }
      counts.set(address, count + 1);
      return true;
    },
    release(address: string) {
      const count = (counts.get(address) ?? 1) - 1;
      if (count > 0) {
        counts.set(address, count);
      } else {
        counts.delete(address);
      }
    },
    get size() {
      return counts.size;
    },
  };
};

export const createMessageGate = (limits: Limits, clock: Clock) => {
  let windowStart = Number.NEGATIVE_INFINITY;
  let count = 0;
  return (bytes: number): ErrorCode | undefined => {
    const now = clock.now();
    if (now - windowStart >= 1000) {
      windowStart = now;
      count = 0;
    }
    count++;
    if (count > limits.messagesPerSecond) {
      return "TOO_MANY_MESSAGES";
    }
    return bytes > limits.messageBytes ? "MESSAGE_TOO_LARGE" : undefined;
  };
};
