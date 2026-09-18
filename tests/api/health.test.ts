import { describe, expect, it } from "vitest";
import { buildServer } from "../../src/api/server.js";

describe("GET /api/v1/health", () => {
  it("returns 200 with an ok status payload", async () => {
    const app = buildServer();

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/health",
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBeTypeOf("string");
    expect(body.timestamp).toBeTypeOf("string");

    await app.close();
  });
});
