import { translateDbError } from "../api/http/db-errors.js";
import { badRequest, notFound } from "../api/http/errors.js";
import { recordExists } from "../api/http/exists.js";
import {
  optionalEnum,
  optionalString,
  optionalUuid,
  requireString,
} from "../api/http/validation.js";
import {
  createProduct,
  deactivateProduct,
  getProductById,
  listProducts,
  updateProduct,
  type ProductFilters,
  type ProductRow,
} from "./product.repository.js";

const PRODUCT_STATUSES = ["draft", "active", "inactive"] as const;

export async function listProductsService(
  query: Record<string, unknown>,
  limit: number,
  offset: number,
): Promise<{ rows: ProductRow[]; total: number }> {
  const filters: ProductFilters = {};
  const categoryId = optionalUuid(query, "category_id");
  if (categoryId) filters.categoryId = categoryId;
  const status = optionalEnum(query, "status", PRODUCT_STATUSES);
  if (status) filters.status = status;

  return listProducts(filters, limit, offset);
}

export async function getProductService(
  productId: string,
): Promise<ProductRow> {
  const product = await getProductById(productId);
  if (!product) {
    throw notFound("Product");
  }
  return product;
}

export async function createProductService(
  body: Record<string, unknown>,
): Promise<ProductRow> {
  const name = requireString(body, "name");
  const slug = requireString(body, "slug");
  const description = optionalString(body, "description");
  const brand = optionalString(body, "brand");
  const imageUrl = optionalString(body, "image_url");
  const categoryId = optionalUuid(body, "category_id");
  const status = optionalEnum(body, "status", PRODUCT_STATUSES);

  if (categoryId && !(await recordExists("categories", categoryId))) {
    throw badRequest("category_id does not reference an existing category");
  }

  try {
    return await createProduct({
      name,
      slug,
      description,
      brand,
      imageUrl,
      categoryId,
      status,
    });
  } catch (error) {
    throw translateDbError(
      error,
      "A product with this slug already exists",
      "Invalid category_id",
    );
  }
}

export async function updateProductService(
  productId: string,
  body: Record<string, unknown>,
): Promise<ProductRow> {
  await getProductService(productId);

  const name = optionalString(body, "name");
  const description = optionalString(body, "description");
  const brand = optionalString(body, "brand");
  const imageUrl = optionalString(body, "image_url");
  const categoryId = optionalUuid(body, "category_id");
  const status = optionalEnum(body, "status", PRODUCT_STATUSES);

  if (categoryId && !(await recordExists("categories", categoryId))) {
    throw badRequest("category_id does not reference an existing category");
  }

  try {
    const updated = await updateProduct(productId, {
      name,
      description,
      brand,
      imageUrl,
      categoryId,
      status,
    });
    if (!updated) {
      throw notFound("Product");
    }
    return updated;
  } catch (error) {
    throw translateDbError(
      error,
      "A product with this slug already exists",
      "Invalid category_id",
    );
  }
}

export async function deactivateProductService(
  productId: string,
): Promise<ProductRow> {
  await getProductService(productId);
  const updated = await deactivateProduct(productId);
  if (!updated) {
    throw notFound("Product");
  }
  return updated;
}
