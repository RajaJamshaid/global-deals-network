import { afterAll, describe, expect, it } from "vitest";
import { buildServer } from "../../src/api/server.js";
import { closePool } from "../../src/config/database.js";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("Categories API", () => {
  const app = buildServer();

  afterAll(async () => {
    await app.close();
    await closePool();
  });

  it("lists categories including the seeded starter set", async () => {
    const response = await app.inject({ method: "GET", url: "/api/v1/categories" });
    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.meta.total).toBeGreaterThan(0);

    const electronics = body.data.find(
      (category: { slug: string }) => category.slug === "electronics",
    );
    expect(electronics).toBeDefined();
  });

  it("gets an existing category by id", async () => {
    const list = await app.inject({ method: "GET", url: "/api/v1/categories?limit=100" });
    const electronics = list
      .json()
      .data.find((category: { slug: string }) => category.slug === "electronics");

    const response = await app.inject({
      method: "GET",
      url: `/api/v1/categories/${electronics.category_id}`,
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().data.slug).toBe("electronics");
  });

  it("returns 404 for a missing category", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/categories/00000000-0000-0000-0000-000000000000",
    });
    expect(response.statusCode).toBe(404);
  });
});
