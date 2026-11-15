import type { ServerMessage } from "@bowling/domain";
import type { SessionSocket } from "../src/session.js";

export class FakeSocket implements SessionSocket {
  readyState: SessionSocket["readyState"] = 0;
  sent: unknown[] = [];
  onopen: SessionSocket["onopen"] = null;
  onmessage: SessionSocket["onmessage"] = null;
  onclose: SessionSocket["onclose"] = null;

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
