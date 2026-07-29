import { Injectable } from "@nestjs/common";
import type { Permission } from "@prisma/client";
import { PermissionsRepository } from "./permissions.repository";

export interface PermissionGroup {
  module: string;
  permissions: Permission[];
}

@Injectable()
export class PermissionsService {
  constructor(private readonly repo: PermissionsRepository) {}

  async listGroupedByModule(): Promise<PermissionGroup[]> {
    const permissions = await this.repo.findAll();
    const byModule = permissions.reduce<Record<string, Permission[]>>((groups, permission) => {
      (groups[permission.module] ??= []).push(permission);
      return groups;
    }, {});
    return Object.entries(byModule).map(([module, permissions]) => ({ module, permissions }));
  }
}
