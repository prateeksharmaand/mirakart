import { Injectable } from "@nestjs/common";
import type { MerchantDocumentStatus, MerchantDocumentType, MerchantStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { buildOrderBy } from "../common/utils/sort.util";

const MERCHANT_SORT_FIELDS = ["createdAt", "storeName", "email", "status"] as const;
const merchantMediaInclude = { logoMedia: true, bannerMedia: true };

export interface MerchantListFilter {
  status?: MerchantStatus;
  search?: string;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

@Injectable()
export class MerchantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(filter: MerchantListFilter) {
    const where: Prisma.MerchantWhereInput = {
      deletedAt: null,
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.search
        ? {
            OR: [
              { storeName: { contains: filter.search, mode: "insensitive" } },
              { email: { contains: filter.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, totalItems] = await Promise.all([
      this.prisma.merchant.findMany({
        where,
        include: { ...merchantMediaInclude, _count: { select: { products: true } } },
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy: buildOrderBy(filter.sortBy, filter.sortOrder, MERCHANT_SORT_FIELDS, "createdAt"),
      }),
      this.prisma.merchant.count({ where }),
    ]);

    return { items, totalItems };
  }

  findById(id: string) {
    return this.prisma.merchant.findFirst({ where: { id, deletedAt: null }, include: merchantMediaInclude });
  }

  updateProfile(
    id: string,
    data: Partial<{
      storeName: string;
      description: string;
      logoMediaId: string;
      bannerMediaId: string;
      phone: string;
      businessRegistrationNumber: string;
      taxId: string;
      addressLine1: string;
      addressLine2: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    }>,
  ) {
    return this.prisma.merchant.update({ where: { id }, data });
  }

  setStatus(
    id: string,
    data: { status: MerchantStatus; approvedById?: string; approvedAt?: Date; rejectionReason?: string | null },
  ) {
    return this.prisma.merchant.update({ where: { id }, data });
  }

  createDocument(data: { merchantId: string; mediaId: string; type: MerchantDocumentType }) {
    return this.prisma.merchantDocument.create({ data });
  }

  findDocuments(merchantId: string) {
    return this.prisma.merchantDocument.findMany({
      where: { merchantId },
      orderBy: { uploadedAt: "desc" },
    });
  }

  findDocumentById(id: string) {
    return this.prisma.merchantDocument.findUnique({ where: { id } });
  }

  updateDocumentStatus(id: string, status: MerchantDocumentStatus) {
    return this.prisma.merchantDocument.update({ where: { id }, data: { status } });
  }

  // Product/order counts — direct Prisma aggregation, same style as
  // ReportsRepository (which is reused for the sales/stock/best-seller
  // figures rather than duplicated here — see MerchantsService.getStats).
  async getCounts(merchantId: string) {
    const [totalProducts, activeProducts, suspendedProducts, totalOrders, completedOrders, cancelledOrders] =
      await Promise.all([
        this.prisma.product.count({ where: { merchantId, deletedAt: null } }),
        this.prisma.product.count({ where: { merchantId, status: "APPROVED", deletedAt: null } }),
        this.prisma.product.count({ where: { merchantId, status: "SUSPENDED", deletedAt: null } }),
        this.prisma.order.count({ where: { items: { some: { merchantId } }, deletedAt: null } }),
        this.prisma.order.count({ where: { items: { some: { merchantId } }, status: "COMPLETED", deletedAt: null } }),
        this.prisma.order.count({ where: { items: { some: { merchantId } }, status: "CANCELLED", deletedAt: null } }),
      ]);
    return {
      totalProducts,
      activeProducts,
      suspendedProducts,
      totalOrders,
      completedOrders,
      cancelledOrders,
      pendingOrders: totalOrders - completedOrders - cancelledOrders,
    };
  }
}
