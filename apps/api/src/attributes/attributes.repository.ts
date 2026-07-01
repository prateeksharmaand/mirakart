import { Injectable } from "@nestjs/common";
import type { AttributeType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const attributeWithValuesInclude = {
  values: { orderBy: { sortOrder: "asc" as const } },
};

@Injectable()
export class AttributesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.attribute.findMany({ include: attributeWithValuesInclude, orderBy: { name: "asc" } });
  }

  findById(id: string) {
    return this.prisma.attribute.findUnique({ where: { id }, include: attributeWithValuesInclude });
  }

  findBySlug(slug: string) {
    return this.prisma.attribute.findUnique({ where: { slug } });
  }

  create(data: {
    name: string;
    slug: string;
    type: AttributeType;
    values: { value: string; colorHex?: string; sortOrder: number }[];
  }) {
    return this.prisma.attribute.create({
      data: {
        name: data.name,
        slug: data.slug,
        type: data.type,
        values: { create: data.values },
      },
      include: attributeWithValuesInclude,
    });
  }

  update(id: string, data: Partial<{ name: string; type: AttributeType }>) {
    return this.prisma.attribute.update({ where: { id }, data, include: attributeWithValuesInclude });
  }

  delete(id: string) {
    return this.prisma.attribute.delete({ where: { id } });
  }

  addValue(attributeId: string, data: { value: string; colorHex?: string; sortOrder: number }) {
    return this.prisma.attributeValue.create({ data: { ...data, attributeId } });
  }

  findValueById(id: string) {
    return this.prisma.attributeValue.findUnique({ where: { id } });
  }

  deleteValue(id: string) {
    return this.prisma.attributeValue.delete({ where: { id } });
  }

  countProductUsage(attributeId: string): Promise<number> {
    return this.prisma.productAttribute.count({ where: { attributeId } });
  }

  countValueUsage(attributeValueId: string): Promise<number> {
    return this.prisma.productVariantAttributeValue.count({ where: { attributeValueId } });
  }
}
