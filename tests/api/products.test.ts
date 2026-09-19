import { afterAll, describe, expect, it } from "vitest";
import { buildServer } from "../../src/api/server.js";
import { closePool } from "../../src/config/database.js";
import { getSeededCategoryId, uniqueSlug } from "./test-helpers.js";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("Products API", () => {
  const app = buildServer();

  afterAll(async () => {
    await app.close();
    await closePool();
  });

  it("creates a product", async () => {
    const categoryId = await getSeededCategoryId(app);
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/products",
      payload: {
        name: "Test Widget",
        slug: uniqueSlug("test-widget"),
        category_id: categoryId,
      },
    });
    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe("Test Widget");
    expect(body.data.status).toBe("active");
  });

  it("rejects creation with missing required fields (400)", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/products",
      payload: { name: "No Slug Here" },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().success).toBe(false);
    expect(response.json().error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects creation with a non-existent category_id (400)", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/products",
      payload: {
        name: "Bad Category Product",
        slug: uniqueSlug("bad-category-product"),
        category_id: "00000000-0000-0000-0000-000000000000",
      },
    });
    expect(response.statusCode).toBe(400);
  });

  it("lists products", async () => {
    const slug = uniqueSlug("list-widget");
    await app.inject({
      method: "POST",
      url: "/api/v1/products",
      payload: { name: "List Widget", slug },
    });

    const response = await app.inject({ method: "GET", url: "/api/v1/products" });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta.total).toBeGreaterThan(0);
  });

  it("gets a product by id", async () => {
    const slug = uniqueSlug("get-widget");
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/products",
      payload: { name: "Get Widget", slug },
    });
    const productId = created.json().data.product_id;

    const response = await app.inject({ method: "GET", url: `/api/v1/products/${productId}` });
    expect(response.statusCode).toBe(200);
    expect(response.json().data.slug).toBe(slug);
  });

  it("returns 404 for a missing product", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/products/00000000-0000-0000-0000-000000000000",
    });
    expect(response.statusCode).toBe(404);
  });

  it("updates a product", async () => {
    const slug = uniqueSlug("update-widget");
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/products",
      payload: { name: "Update Widget", slug },
    });
    const productId = created.json().data.product_id;

    const response = await app.inject({
      method: "PATCH",
      url: `/api/v1/products/${productId}`,
      payload: { name: "Updated Widget Name" },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().data.name).toBe("Updated Widget Name");
  });

  it("deactivates a product on delete (status = inactive, not removed)", async () => {
    const slug = uniqueSlug("delete-widget");
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/products",
      payload: { name: "Delete Widget", slug },
    });
    const productId = created.json().data.product_id;

    const deleteResponse = await app.inject({
      method: "DELETE",
      url: `/api/v1/products/${productId}`,
    });
    expect(deleteResponse.statusCode).toBe(204);

    const getResponse = await app.inject({ method: "GET", url: `/api/v1/products/${productId}` });
    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.json().data.status).toBe("inactive");
  });
});
