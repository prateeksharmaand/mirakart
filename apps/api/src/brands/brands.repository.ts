import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { buildOrderBy } from "../common/utils/sort.util";

const BRAND_SORT_FIELDS = ["name", "createdAt", "code"] as const;

const brandMediaInclude = { logoMedia: true };

@Injectable()
export class BrandsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllActive() {
    return this.prisma.brand.findMany({
      where: { deletedAt: null, isActive: true },
      include: brandMediaInclude,
      orderBy: { name: "asc" },
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
      this.prisma.brand.findMany({
        where,
        include: brandMediaInclude,
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy: buildOrderBy(filter.sortBy, filter.sortOrder, BRAND_SORT_FIELDS, "name"),
      }),
      this.prisma.brand.count({ where }),
    ]);
    return { items, totalItems };
  }

  findBySlug(slug: string) {
    return this.prisma.brand.findFirst({ where: { slug, deletedAt: null }, include: brandMediaInclude });
  }

  findById(id: string) {
    return this.prisma.brand.findFirst({ where: { id, deletedAt: null }, include: brandMediaInclude });
  }

  findByCode(code: string) {
    return this.prisma.brand.findFirst({ where: { code } });
  }

  create(data: { name: string; slug: string; code: string; description?: string; logoMediaId?: string }) {
    return this.prisma.brand.create({ data });
  }

  update(
    id: string,
    data: Partial<{ name: string; code: string; description: string; logoMediaId: string; isActive: boolean }>,
  ) {
    return this.prisma.brand.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return this.prisma.brand.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  countActiveProducts(id: string): Promise<number> {
    return this.prisma.product.count({ where: { brandId: id, deletedAt: null } });
  }
}
