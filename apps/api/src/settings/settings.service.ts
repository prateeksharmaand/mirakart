import { BadRequestException, Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { SettingsRepository } from "./settings.repository";
import type { UpdateSettingDto } from "./dto/update-setting.dto";

@Injectable()
export class SettingsService {
  constructor(private readonly repo: SettingsRepository) {}

  list(group?: string) {
    return this.repo.findMany(group);
  }

  async update(key: string, dto: UpdateSettingDto, adminId: string) {
    const existing = await this.repo.findByKey(key);
    if (!existing && !dto.group) {
      throw new BadRequestException("group is required when creating a new setting");
    }
    return this.repo.upsert(key, dto.value as Prisma.InputJsonValue, dto.group ?? existing!.group, adminId);
  }
}
