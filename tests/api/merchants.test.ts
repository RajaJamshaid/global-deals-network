import { afterAll, describe, expect, it } from "vitest";
import { buildServer } from "../../src/api/server.js";
import { closePool } from "../../src/config/database.js";
import { uniqueSlug } from "./test-helpers.js";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("Merchants API", () => {
  const app = buildServer();

  afterAll(async () => {
    await app.close();
    await closePool();
  });

  it("creates a merchant", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/merchants",
      payload: { name: "Test Store", slug: uniqueSlug("test-store") },
    });
    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.data.merchant_status).toBe("active");
    expect(body.data.affiliate_status).toBe("pending");
  });

  it("rejects creation with missing required fields (400)", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/merchants",
      payload: { name: "No Slug Store" },
    });
    expect(response.statusCode).toBe(400);
  });

  it("rejects a duplicate slug (409)", async () => {
    const slug = uniqueSlug("dup-store");
    const first = await app.inject({
      method: "POST",
      url: "/api/v1/merchants",
      payload: { name: "Dup Store", slug },
    });
    expect(first.statusCode).toBe(201);

    const second = await app.inject({
      method: "POST",
      url: "/api/v1/merchants",
      payload: { name: "Dup Store Again", slug },
    });
    expect(second.statusCode).toBe(409);
    expect(second.json().error.code).toBe("CONFLICT");
  });

  it("lists merchants, including the seeded Amazon merchant", async () => {
    const response = await app.inject({ method: "GET", url: "/api/v1/merchants?limit=100" });
    expect(response.statusCode).toBe(200);
    const amazon = response
      .json()
      .data.find((merchant: { slug: string }) => merchant.slug === "amazon");
    expect(amazon).toBeDefined();
  });

  it("gets a merchant by id", async () => {
    const slug = uniqueSlug("get-store");
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/merchants",
      payload: { name: "Get Store", slug },
    });
    const merchantId = created.json().data.merchant_id;

    const response = await app.inject({ method: "GET", url: `/api/v1/merchants/${merchantId}` });
    expect(response.statusCode).toBe(200);
    expect(response.json().data.slug).toBe(slug);
  });

  it("updates a merchant", async () => {
    const slug = uniqueSlug("update-store");
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/merchants",
      payload: { name: "Update Store", slug },
    });
    const merchantId = created.json().data.merchant_id;

    const response = await app.inject({
      method: "PATCH",
      url: `/api/v1/merchants/${merchantId}`,
      payload: { description: "Now with a description." },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().data.description).toBe("Now with a description.");
  });

  it("deactivates a merchant on delete", async () => {
    const slug = uniqueSlug("delete-store");
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/merchants",
      payload: { name: "Delete Store", slug },
    });
    const merchantId = created.json().data.merchant_id;

    const deleteResponse = await app.inject({
      method: "DELETE",
      url: `/api/v1/merchants/${merchantId}`,
    });
    expect(deleteResponse.statusCode).toBe(204);

    const getResponse = await app.inject({
      method: "GET",
      url: `/api/v1/merchants/${merchantId}`,
    });
    expect(getResponse.json().data.merchant_status).toBe("inactive");
  });
});
