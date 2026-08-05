import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { buildOrderBy } from "../common/utils/sort.util";

const ROLE_SORT_FIELDS = ["name", "createdAt"] as const;

const roleWithPermissionsSelect = {
  id: true,
  name: true,
  description: true,
  isSystem: true,
  createdAt: true,
  updatedAt: true,
  permissions: { select: { permission: { select: { id: true, code: true, module: true, action: true } } } },
} as const;

// Prisma returns the junction rows as `{ permission: {...} }[]` — flatten to
// the plain Permission[] shape the API contract (and frontend) expect.
function flattenPermissions<T extends { permissions: { permission: unknown }[] }>(
  role: T,
): Omit<T, "permissions"> & { permissions: T["permissions"][number]["permission"][] } {
  return { ...role, permissions: role.permissions.map((rp) => rp.permission) };
}

@Injectable()
export class RolesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany() {
    const roles = await this.prisma.role.findMany({ select: roleWithPermissionsSelect, orderBy: { name: "asc" } });
    return roles.map(flattenPermissions);
  }

  async findAdminList(filter: {
    search?: string;
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    const where = {
      ...(filter.search ? { name: { contains: filter.search, mode: "insensitive" as const } } : {}),
    };
    const [roles, totalItems] = await Promise.all([
      this.prisma.role.findMany({
        where,
        select: roleWithPermissionsSelect,
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy: buildOrderBy(filter.sortBy, filter.sortOrder, ROLE_SORT_FIELDS, "name"),
      }),
      this.prisma.role.count({ where }),
    ]);
    return { items: roles.map(flattenPermissions), totalItems };
  }

  async findById(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id }, select: roleWithPermissionsSelect });
    return role ? flattenPermissions(role) : null;
  }

  findByName(name: string) {
    return this.prisma.role.findUnique({ where: { name } });
  }

  async create(data: { name: string; description?: string; permissionIds: string[] }) {
    const role = await this.prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        permissions: { create: data.permissionIds.map((permissionId) => ({ permissionId })) },
      },
      select: roleWithPermissionsSelect,
    });
    return flattenPermissions(role);
  }

  async update(id: string, data: { name?: string; description?: string; permissionIds?: string[] }) {
    const role = await this.prisma.$transaction(async (tx) => {
      if (data.permissionIds) {
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
      }
      return tx.role.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          ...(data.permissionIds
            ? { permissions: { create: data.permissionIds.map((permissionId) => ({ permissionId })) } }
            : {}),
        },
        select: roleWithPermissionsSelect,
      });
    });
    return flattenPermissions(role);
  }

  delete(id: string) {
    return this.prisma.role.delete({ where: { id } });
  }

  countAdminsWithRole(id: string) {
    return this.prisma.adminUser.count({ where: { roleId: id, deletedAt: null } });
  }
}
