import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CustomerQueriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByProduct(productId: string, publicOnly = true) {
    return this.prisma.customerQuery.findMany({
      where: {
        productId,
        deletedAt: null,
        ...(publicOnly ? { isPublic: true, answer: { not: null } } : {}),
      },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  findById(id: string) {
    return this.prisma.customerQuery.findFirst({
      where: { id, deletedAt: null },
    });
  }

  findByMerchant(merchantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return Promise.all([
      this.prisma.customerQuery.findMany({
        where: {
          product: { merchantId, deletedAt: null },
          deletedAt: null,
        },
        include: {
          product: { select: { id: true, name: true, slug: true } },
          customer: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: [{ answer: "asc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      this.prisma.customerQuery.count({
        where: { product: { merchantId, deletedAt: null }, deletedAt: null },
      }),
    ]);
  }

  create(data: {
    id: string;
    productId: string;
    customerId?: string;
    guestName?: string;
    guestEmail?: string;
    question: string;
  }) {
    return this.prisma.customerQuery.create({ data });
  }

  answer(id: string, answer: string, merchantId: string) {
    return this.prisma.customerQuery.update({
      where: { id },
      data: { answer, answeredAt: new Date(), answeredByMerchantId: merchantId },
    });
  }

  softDelete(id: string) {
    return this.prisma.customerQuery.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
