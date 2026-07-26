import { describe, expect, it } from "vitest";
import { getServerName } from "./index";

describe("getServerName", () => {
  it("returns the server name", () => {
    expect(getServerName()).toBe("finpulse-mcp-server");
  });
});
