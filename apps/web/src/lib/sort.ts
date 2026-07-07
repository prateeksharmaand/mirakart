export function parseSortParam(sort?: string): { sortBy: string; sortOrder: "asc" | "desc" } {
  switch (sort) {
    case "price-asc":
      return { sortBy: "basePrice", sortOrder: "asc" };
    case "price-desc":
      return { sortBy: "basePrice", sortOrder: "desc" };
    case "name-asc":
      return { sortBy: "name", sortOrder: "asc" };
    case "name-desc":
      return { sortBy: "name", sortOrder: "desc" };
    default:
      return { sortBy: "createdAt", sortOrder: "desc" };
  }
}
