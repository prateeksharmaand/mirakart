import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(group?: string) {
    return this.prisma.setting.findMany({
      where: group ? { group } : undefined,
      orderBy: [{ group: "asc" }, { key: "asc" }],
    });
  }

  findByKey(key: string) {
    return this.prisma.setting.findUnique({ where: { key } });
  }

  upsert(key: string, value: Prisma.InputJsonValue, group: string, updatedById: string) {
    return this.prisma.setting.upsert({
      where: { key },
      update: { value, updatedById },
      create: { key, value, group, updatedById },
    });
  }
}
