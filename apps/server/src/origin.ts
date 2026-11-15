import type { IncomingMessage } from "node:http";

const HOST = /^[a-z0-9.-]+(:\d+)?$/i;
const PROTOCOL = /^https?$/;

// The proxy appends its own value last; earlier entries are client-supplied.
const forwarded = (request: IncomingMessage, name: string) =>
  String(request.headers[name] ?? "")
    .split(",")
    .at(-1)
    ?.trim();

// Empty when the address looks forged, so the page falls back to relative URLs.
export const originOf = (
  request: IncomingMessage,
  trustProxy: boolean,
): string => {
  const host =
    (trustProxy && forwarded(request, "x-forwarded-host")) ||
    request.headers.host ||
    "";
  const protocol =
    (trustProxy && forwarded(request, "x-forwarded-proto")) || "http";
  return HOST.test(host) && PROTOCOL.test(protocol)
    ? `${protocol}://${host}`
    : "";
};
