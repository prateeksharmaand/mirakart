import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { buildOrderBy } from "../common/utils/sort.util";

const CATEGORY_SORT_FIELDS = ["name", "createdAt", "sortOrder"] as const;

const categoryMediaInclude = { iconMedia: true, bannerMedia: true };

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllActive() {
    return this.prisma.category.findMany({
      where: { deletedAt: null, isActive: true },
      include: categoryMediaInclude,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  }

  async findAdminList(filter: {
    search?: string;
    isActive?: boolean;
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    const where = {
      deletedAt: null,
      ...(filter.isActive !== undefined ? { isActive: filter.isActive } : {}),
      ...(filter.search ? { name: { contains: filter.search, mode: "insensitive" as const } } : {}),
    };
    const [items, totalItems] = await Promise.all([
      this.prisma.category.findMany({
        where,
        include: { ...categoryMediaInclude, parent: { select: { id: true, name: true } } },
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy: buildOrderBy(filter.sortBy, filter.sortOrder, CATEGORY_SORT_FIELDS, "name"),
      }),
      this.prisma.category.count({ where }),
    ]);
    return { items, totalItems };
  }

  findBySlug(slug: string) {
    return this.prisma.category.findFirst({ where: { slug, deletedAt: null }, include: categoryMediaInclude });
  }

  findById(id: string) {
    return this.prisma.category.findFirst({ where: { id, deletedAt: null }, include: categoryMediaInclude });
  }

  create(data: {
    name: string;
    slug: string;
    description?: string;
    parentId?: string;
    iconMediaId?: string;
    bannerMediaId?: string;
    sortOrder?: number;
  }) {
    return this.prisma.category.create({ data, include: categoryMediaInclude });
  }

  update(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      parentId: string | null;
      iconMediaId: string;
      bannerMediaId: string;
      isActive: boolean;
      sortOrder: number;
    }>,
  ) {
    return this.prisma.category.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return this.prisma.category.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  countChildren(id: string): Promise<number> {
    return this.prisma.category.count({ where: { parentId: id, deletedAt: null } });
  }

  countActiveProducts(id: string): Promise<number> {
    return this.prisma.product.count({ where: { categoryId: id, deletedAt: null } });
  }

  // ── Category-Attribute assignment ──────────────────────────────────────────

  findAttributesByCategoryId(categoryId: string) {
    return this.prisma.categoryAttribute.findMany({
      where: { categoryId },
      include: {
        attribute: { include: { values: { orderBy: { sortOrder: "asc" } } } },
      },
      orderBy: { sortOrder: "asc" },
    });
  }

  findCategoryAttribute(categoryId: string, attributeId: string) {
    return this.prisma.categoryAttribute.findUnique({
      where: { categoryId_attributeId: { categoryId, attributeId } },
    });
  }

  assignAttribute(data: {
    id: string;
    categoryId: string;
    attributeId: string;
    sortOrder?: number;
    isRequired?: boolean;
  }) {
    return this.prisma.categoryAttribute.create({ data });
  }

  updateCategoryAttribute(id: string, data: Partial<{ sortOrder: number; isRequired: boolean }>) {
    return this.prisma.categoryAttribute.update({ where: { id }, data });
  }

  unassignAttribute(categoryId: string, attributeId: string) {
    return this.prisma.categoryAttribute.delete({
      where: { categoryId_attributeId: { categoryId, attributeId } },
    });
  }

  countCategoryAttributes(categoryId: string): Promise<number> {
    return this.prisma.categoryAttribute.count({ where: { categoryId } });
  }
}
