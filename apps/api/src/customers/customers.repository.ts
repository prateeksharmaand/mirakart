import { Injectable } from "@nestjs/common";
import type { Address, AddressType, Customer, CustomerStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { buildOrderBy } from "../common/utils/sort.util";

const CUSTOMER_SORT_FIELDS = ["createdAt", "email", "firstName", "lastName", "status"] as const;

export interface CustomerListFilter {
  status?: CustomerStatus;
  search?: string;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

@Injectable()
export class CustomersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(filter: CustomerListFilter) {
    const where: Prisma.CustomerWhereInput = {
      deletedAt: null,
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.search
        ? {
            OR: [
              { email: { contains: filter.search, mode: "insensitive" } },
              { firstName: { contains: filter.search, mode: "insensitive" } },
              { lastName: { contains: filter.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, totalItems] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy: buildOrderBy(filter.sortBy, filter.sortOrder, CUSTOMER_SORT_FIELDS, "createdAt"),
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { items, totalItems };
  }

  findById(id: string): Promise<Customer | null> {
    return this.prisma.customer.findFirst({ where: { id, deletedAt: null } });
  }

  updateProfile(id: string, data: Partial<{ firstName: string; lastName: string; phone: string }>) {
    return this.prisma.customer.update({ where: { id }, data });
  }

  setStatus(id: string, status: CustomerStatus) {
    return this.prisma.customer.update({ where: { id }, data: { status } });
  }

  findAddresses(customerId: string): Promise<Address[]> {
    return this.prisma.address.findMany({ where: { customerId }, orderBy: { createdAt: "desc" } });
  }

  findAddressById(id: string): Promise<Address | null> {
    return this.prisma.address.findUnique({ where: { id } });
  }

  async createAddress(
    customerId: string,
    data: {
      label?: string;
      fullName: string;
      phone: string;
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      type: AddressType;
      isDefault: boolean;
    },
  ): Promise<Address> {
    return this.prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.address.updateMany({ where: { customerId }, data: { isDefault: false } });
      }
      return tx.address.create({ data: { ...data, customerId } });
    });
  }

  async updateAddress(
    id: string,
    customerId: string,
    data: Partial<{
      label: string;
      fullName: string;
      phone: string;
      line1: string;
      line2: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      type: AddressType;
      isDefault: boolean;
    }>,
  ): Promise<Address> {
    return this.prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.address.updateMany({ where: { customerId }, data: { isDefault: false } });
      }
      return tx.address.update({ where: { id }, data });
    });
  }

  deleteAddress(id: string) {
    return this.prisma.address.delete({ where: { id } });
  }
}
