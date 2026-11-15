import { describe, expect, it } from "vitest";
import { type Client, useServer } from "./harness.js";

const from = (address: string) => ({
  "x-forwarded-for": `1.1.1.1, ${address}`,
});

const expectRefused = async (client: Client) => {
  expect(await client.next()).toEqual({
    type: "error",
    error: "TOO_MANY_CONNECTIONS",
  });
  await client.closed;
};

const expectAdmitted = async (client: Client) => {
  client.send({ type: "start" });
  expect(await client.next()).toMatchObject({ error: "NOT_IN_ROOM" });
};

describe("behind a trusted proxy, the connection cap per address", () => {
  const { connect, expectEmpty } = useServer(
    { connectionsPerAddress: 3 },
    { trustProxy: true },
  );

  it("counts the proxy's X-Forwarded-For entry", async () => {
    const admitted = [
      await connect(from("2.2.2.2")),
      await connect(from("2.2.2.2")),
      await connect(from("2.2.2.2")),
    ];
    await expectRefused(await connect(from("2.2.2.2")));
    const other = await connect(from("3.3.3.3"));
    await expectAdmitted(other);

    for (const client of [...admitted, other]) {
      client.close();
      await client.closed;
    }
    await expectEmpty();
  });
});

describe("without a trusted proxy, the connection cap per address", () => {
  const { connect } = useServer({ connectionsPerAddress: 3 });

  it("ignores X-Forwarded-For and counts the socket address", async () => {
    await connect(from("2.2.2.2"));
    await connect(from("3.3.3.3"));
    await connect(from("4.4.4.4"));

    await expectRefused(await connect(from("5.5.5.5")));
  });
});
