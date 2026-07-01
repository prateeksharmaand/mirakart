import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const roleWithPermissionsSelect = {
  id: true,
  name: true,
  description: true,
  isSystem: true,
  createdAt: true,
  updatedAt: true,
  permissions: { select: { permission: { select: { id: true, code: true, module: true, action: true } } } },
} as const;

@Injectable()
export class RolesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany() {
    return this.prisma.role.findMany({ select: roleWithPermissionsSelect, orderBy: { name: "asc" } });
  }

  findById(id: string) {
    return this.prisma.role.findUnique({ where: { id }, select: roleWithPermissionsSelect });
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
    return role;
  }

  async update(id: string, data: { name?: string; description?: string; permissionIds?: string[] }) {
    return this.prisma.$transaction(async (tx) => {
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
  }

  delete(id: string) {
    return this.prisma.role.delete({ where: { id } });
  }

  countAdminsWithRole(id: string) {
    return this.prisma.adminUser.count({ where: { roleId: id, deletedAt: null } });
  }
}
