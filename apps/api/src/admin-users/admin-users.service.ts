import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import * as argon2 from "argon2";
import { AdminUsersRepository } from "./admin-users.repository";
import type { AdminUserQueryDto } from "./dto/admin-user-query.dto";
import type { CreateAdminUserDto } from "./dto/create-admin-user.dto";
import type { UpdateAdminUserDto } from "./dto/update-admin-user.dto";

@Injectable()
export class AdminUsersService {
  constructor(private readonly repo: AdminUsersRepository) {}

  async list(query: AdminUserQueryDto) {
    const { items, totalItems } = await this.repo.findMany({
      status: query.status,
      roleId: query.roleId,
      search: query.search,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
    return {
      data: items,
      meta: {
        page: query.page,
        limit: query.limit,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / query.limit)),
      },
    };
  }

  async findOne(id: string) {
    const admin = await this.repo.findById(id);
    if (!admin) throw new NotFoundException("Admin user not found");
    return admin;
  }

  async create(dto: CreateAdminUserDto) {
    const existing = await this.repo.findByEmail(dto.email);
    if (existing) throw new ConflictException("Email is already registered");

    const passwordHash = await argon2.hash(dto.password);
    return this.repo.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      roleId: dto.roleId,
    });
  }

  async update(id: string, dto: UpdateAdminUserDto, currentAdminId: string) {
    await this.findOne(id);
    if (id === currentAdminId && dto.status && dto.status !== "ACTIVE") {
      throw new ForbiddenException("You cannot deactivate your own account");
    }
    return this.repo.update(id, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      status: dto.status,
      roleId: dto.roleId,
    });
  }

  async remove(id: string, currentAdminId: string): Promise<void> {
    await this.findOne(id);
    if (id === currentAdminId) {
      throw new ForbiddenException("You cannot delete your own account");
    }
    await this.repo.softDelete(id);
  }
}
