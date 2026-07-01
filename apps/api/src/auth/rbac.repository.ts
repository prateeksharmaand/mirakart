import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface AdminAuthorization {
  isSuperAdmin: boolean;
  permissionCodes: string[];
}

@Injectable()
export class RbacRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminAuthorization(adminId: string): Promise<AdminAuthorization | null> {
    const admin = await this.prisma.adminUser.findFirst({
      where: { id: adminId, deletedAt: null, status: "ACTIVE" },
      select: {
        isSuperAdmin: true,
        role: { select: { permissions: { select: { permission: { select: { code: true } } } } } },
      },
    });
    if (!admin) return null;

    return {
      isSuperAdmin: admin.isSuperAdmin,
      permissionCodes: admin.role?.permissions.map((rp) => rp.permission.code) ?? [],
    };
  }
}
