import { Injectable } from "@nestjs/common";
import type { AdminStatus, AdminUser, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { buildOrderBy } from "../common/utils/sort.util";

const ADMIN_USER_SORT_FIELDS = ["createdAt", "email", "firstName", "lastName", "status"] as const;

export interface AdminUserListFilter {
  status?: AdminStatus;
  roleId?: string;
  search?: string;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

const adminUserListSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  status: true,
  isSuperAdmin: true,
  roleId: true,
  role: { select: { id: true, name: true } },
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AdminUserSelect;

@Injectable()
export class AdminUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(filter: AdminUserListFilter) {
    const where: Prisma.AdminUserWhereInput = {
      deletedAt: null,
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.roleId ? { roleId: filter.roleId } : {}),
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
      this.prisma.adminUser.findMany({
        where,
        select: adminUserListSelect,
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy: buildOrderBy(filter.sortBy, filter.sortOrder, ADMIN_USER_SORT_FIELDS, "createdAt"),
      }),
      this.prisma.adminUser.count({ where }),
    ]);

    return { items, totalItems };
  }

  findById(id: string) {
    return this.prisma.adminUser.findFirst({ where: { id, deletedAt: null }, select: adminUserListSelect });
  }

  findByEmail(email: string): Promise<AdminUser | null> {
    return this.prisma.adminUser.findFirst({ where: { email, deletedAt: null } });
  }

  create(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone?: string;
    roleId?: string;
  }) {
    return this.prisma.adminUser.create({ data, select: adminUserListSelect });
  }

  update(
    id: string,
    data: Partial<{
      firstName: string;
      lastName: string;
      phone: string;
      status: AdminStatus;
      roleId: string | null;
      passwordHash: string;
    }>,
  ) {
    return this.prisma.adminUser.update({ where: { id }, data, select: adminUserListSelect });
  }

  softDelete(id: string) {
    return this.prisma.adminUser.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
