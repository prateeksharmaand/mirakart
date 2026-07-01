import type { Prisma } from "@prisma/client";

/**
 * Soft-delete middleware for Prisma
 * Automatically adds `deletedAt: null` filter to all queries on tables that support soft-delete
 * Tables with soft-delete: AdminUser, Merchant, Customer, Category, Brand, Product, ProductVariant, Order, Return
 *
 * Usage: prisma.$use(softDeleteMiddleware);
 */

const SOFT_DELETE_TABLES = new Set([
  "AdminUser",
  "Merchant",
  "Customer",
  "Category",
  "Brand",
  "Product",
  "ProductVariant",
  "Order",
  "Return",
]);

export const softDeleteMiddleware: Prisma.Middleware = async (params, next) => {
  // Only apply to read operations: findUnique, findFirst, findMany, count
  if (["findUnique", "findFirst", "findMany", "count"].includes(params.action)) {
    // Check if this model supports soft deletes
    if (SOFT_DELETE_TABLES.has(params.model)) {
      // Merge deletedAt: null into the where clause
      if (params.args.where === undefined) {
        params.args.where = {};
      }

      // Combine existing where with deletedAt filter using AND
      if (Object.keys(params.args.where).length > 0) {
        params.args.where = {
          AND: [params.args.where, { deletedAt: null }],
        };
      } else {
        params.args.where.deletedAt = null;
      }
    }
  }

  // For delete operations, convert to soft delete (set deletedAt)
  if (params.action === "delete" && SOFT_DELETE_TABLES.has(params.model)) {
    params.action = "update";
    params.args.data = { deletedAt: new Date() };
  }

  // For deleteMany, convert to updateMany with deletedAt
  if (params.action === "deleteMany" && SOFT_DELETE_TABLES.has(params.model)) {
    params.action = "updateMany";
    params.args.data = { deletedAt: new Date() };
  }

  return next(params);
};
