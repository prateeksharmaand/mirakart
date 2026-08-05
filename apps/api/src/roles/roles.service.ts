import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { RolesRepository } from "./roles.repository";
import type { CreateRoleDto } from "./dto/create-role.dto";
import type { UpdateRoleDto } from "./dto/update-role.dto";
import type { RoleQueryDto } from "./dto/role-query.dto";

function paginate(page: number, limit: number, totalItems: number) {
  return { page, limit, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / limit)) };
}

@Injectable()
export class RolesService {
  constructor(private readonly repo: RolesRepository) {}

  list() {
    return this.repo.findMany();
  }

  async listAdmin(query: RoleQueryDto) {
    const { items, totalItems } = await this.repo.findAdminList({
      search: query.search,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
    return { data: items, meta: paginate(query.page, query.limit, totalItems) };
  }

  async findOne(id: string) {
    const role = await this.repo.findById(id);
    if (!role) throw new NotFoundException("Role not found");
    return role;
  }

  async create(dto: CreateRoleDto) {
    const existing = await this.repo.findByName(dto.name);
    if (existing) throw new ConflictException("A role with this name already exists");

    try {
      return await this.repo.create(dto);
    } catch (error) {
      throw this.translatePrismaError(error);
    }
  }

  async update(id: string, dto: UpdateRoleDto) {
    await this.findOne(id);
    try {
      return await this.repo.update(id, dto);
    } catch (error) {
      throw this.translatePrismaError(error);
    }
  }

  async remove(id: string): Promise<void> {
    const role = await this.findOne(id);
    if (role.isSystem) throw new ForbiddenException("System roles cannot be deleted");

    const assignedCount = await this.repo.countAdminsWithRole(id);
    if (assignedCount > 0) {
      throw new ConflictException(
        `Cannot delete a role with ${assignedCount} assigned admin(s). Reassign them first.`,
      );
    }
    await this.repo.delete(id);
  }

  private translatePrismaError(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return new BadRequestException("One or more permissionIds are invalid");
    }
    return error;
  }
}
