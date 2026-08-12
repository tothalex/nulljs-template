import { describe, test, expect, beforeEach } from "bun:test";
import { cloudTest, invokeRoute, invokeCron, invokeEvent } from "@tothalex/cloud/testing";

import echo from "./echo";
import hello from "./handler";
import cron from "../cron/cron";
import onTick from "../event/event";

beforeEach(() => cloudTest.reset());

describe("hello", () => {
  test("returns the greeting", async () => {
    const response = await invokeRoute(hello, { method: "GET", path: "/hello" });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body as string).message).toBe("Hello, World!");
  });
});

describe("echo", () => {
  test("repeats the text", async () => {
    // echo declares a schema, so the handler receives the body already parsed —
    // pass an object, exactly like production delivers it.
    const response = await invokeRoute(echo, {
      method: "POST",
      path: "/echo",
      body: { text: "hi", repeat: 3 },
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body as string).echo).toBe("hi hi hi");
  });
});

describe("cron -> event pipeline", () => {
  test("cron sends a tick event the handler can consume", async () => {
    await invokeCron(cron);

    expect(cloudTest.events.sent).toHaveLength(1);
    const event = cloudTest.events.sent[0]!;
    expect(event.name).toBe("tick");

    // Feed the captured payload to the event handler, closing the loop.
    await invokeEvent(onTick, event.payload);
    expect(JSON.parse(event.payload.toString()).at).toBeString();
  });
});
