import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

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

  findAllForAdmin() {
    return this.prisma.brand.findMany({
      where: { deletedAt: null },
      include: brandMediaInclude,
      orderBy: { name: "asc" },
    });
  }

  findBySlug(slug: string) {
    return this.prisma.brand.findFirst({ where: { slug, deletedAt: null }, include: brandMediaInclude });
  }

  findById(id: string) {
    return this.prisma.brand.findFirst({ where: { id, deletedAt: null }, include: brandMediaInclude });
  }

  create(data: { name: string; slug: string; description?: string; logoMediaId?: string }) {
    return this.prisma.brand.create({ data });
  }

  update(
    id: string,
    data: Partial<{ name: string; description: string; logoMediaId: string; isActive: boolean }>,
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
