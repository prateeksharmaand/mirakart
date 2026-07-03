import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { buildOrderBy } from "../common/utils/sort.util";

const TAG_SORT_FIELDS = ["createdAt", "name", "sortOrder"] as const;

@Injectable()
export class TagsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllActive() {
    return this.prisma.tag.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  }

  async findAdminList(filter: { search?: string; isActive?: boolean; page: number; limit: number; sortBy?: string; sortOrder?: "asc" | "desc" }) {
    const where = {
      deletedAt: null,
      ...(filter.isActive !== undefined ? { isActive: filter.isActive } : {}),
      ...(filter.search ? { name: { contains: filter.search, mode: "insensitive" as const } } : {}),
    };

    const [items, totalItems] = await Promise.all([
      this.prisma.tag.findMany({
        where,
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy: buildOrderBy(filter.sortBy, filter.sortOrder, TAG_SORT_FIELDS, "sortOrder"),
      }),
      this.prisma.tag.count({ where }),
    ]);

    return { items, totalItems };
  }

  findById(id: string) {
    return this.prisma.tag.findFirst({ where: { id, deletedAt: null } });
  }

  findBySlug(slug: string) {
    return this.prisma.tag.findFirst({ where: { slug, deletedAt: null } });
  }

  create(data: { name: string; slug: string; description?: string; isActive: boolean; sortOrder: number }) {
    return this.prisma.tag.create({ data });
  }

  update(id: string, data: Partial<{ name: string; slug: string; description: string; isActive: boolean; sortOrder: number }>) {
    return this.prisma.tag.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return this.prisma.tag.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
