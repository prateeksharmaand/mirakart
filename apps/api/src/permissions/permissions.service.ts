import { Injectable } from "@nestjs/common";
import type { Permission } from "@prisma/client";
import { PermissionsRepository } from "./permissions.repository";

@Injectable()
export class PermissionsService {
  constructor(private readonly repo: PermissionsRepository) {}

  async listGroupedByModule(): Promise<Record<string, Permission[]>> {
    const permissions = await this.repo.findAll();
    return permissions.reduce<Record<string, Permission[]>>((groups, permission) => {
      (groups[permission.module] ??= []).push(permission);
      return groups;
    }, {});
  }
}
