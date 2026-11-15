import type { ServerMessage } from "@bowling/domain";
import type { ConnectionSocket } from "../src/connection.js";

export class FakeSocket implements ConnectionSocket {
  readyState: ConnectionSocket["readyState"] = 0;
  sent: unknown[] = [];
  onopen: ConnectionSocket["onopen"] = null;
  onmessage: ConnectionSocket["onmessage"] = null;
  onclose: ConnectionSocket["onclose"] = null;

  send(data: string) {
    this.sent.push(JSON.parse(data));
  }

  open() {
    this.readyState = 1;
    this.onopen?.call(this as never, new Event("open"));
  }

  receive(message: ServerMessage) {
    const event = { data: JSON.stringify(message) } as MessageEvent;
    this.onmessage?.call(this as never, event);
  }

  drop() {
    this.onclose?.call(this as never, {} as CloseEvent);
  }
}
