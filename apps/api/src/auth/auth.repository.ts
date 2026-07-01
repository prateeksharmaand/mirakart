import { Injectable } from "@nestjs/common";
import type { AdminUser, ActorType, Customer, Merchant } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

interface CreateRefreshTokenInput {
  tokenHash: string;
  principalType: ActorType;
  principalId: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
}

interface CreatePasswordResetTokenInput {
  tokenHash: string;
  principalType: ActorType;
  principalId: string;
  expiresAt: Date;
}

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  // --- Principals -----------------------------------------------------

  findAdminByEmail(email: string): Promise<AdminUser | null> {
    return this.prisma.adminUser.findFirst({ where: { email, deletedAt: null } });
  }

  findAdminById(id: string): Promise<AdminUser | null> {
    return this.prisma.adminUser.findFirst({ where: { id, deletedAt: null } });
  }

  updateAdminLastLogin(id: string): Promise<AdminUser> {
    return this.prisma.adminUser.update({ where: { id }, data: { lastLoginAt: new Date() } });
  }

  findMerchantByEmail(email: string): Promise<Merchant | null> {
    return this.prisma.merchant.findFirst({ where: { email, deletedAt: null } });
  }

  findMerchantById(id: string): Promise<Merchant | null> {
    return this.prisma.merchant.findFirst({ where: { id, deletedAt: null } });
  }

  findMerchantByStoreSlug(storeSlug: string): Promise<Merchant | null> {
    return this.prisma.merchant.findFirst({ where: { storeSlug, deletedAt: null } });
  }

  createMerchant(data: {
    storeName: string;
    storeSlug: string;
    email: string;
    passwordHash: string;
    phone: string;
    businessRegistrationNumber?: string;
    taxId?: string;
  }): Promise<Merchant> {
    return this.prisma.merchant.create({ data });
  }

  findCustomerByEmail(email: string): Promise<Customer | null> {
    return this.prisma.customer.findFirst({ where: { email, deletedAt: null } });
  }

  findCustomerById(id: string): Promise<Customer | null> {
    return this.prisma.customer.findFirst({ where: { id, deletedAt: null } });
  }

  createCustomer(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<Customer> {
    return this.prisma.customer.create({ data });
  }

  async updatePrincipalPasswordHash(
    type: ActorType,
    id: string,
    passwordHash: string,
  ): Promise<void> {
    switch (type) {
      case "ADMIN":
        await this.prisma.adminUser.update({ where: { id }, data: { passwordHash } });
        return;
      case "MERCHANT":
        await this.prisma.merchant.update({ where: { id }, data: { passwordHash } });
        return;
      case "CUSTOMER":
        await this.prisma.customer.update({ where: { id }, data: { passwordHash } });
        return;
      case "SYSTEM":
        throw new Error("SYSTEM is not a loginable principal type");
    }
  }

  // --- Refresh tokens ----------------------------------------------------

  createRefreshToken(input: CreateRefreshTokenInput) {
    return this.prisma.refreshToken.create({ data: input });
  }

  findValidRefreshTokenByHash(tokenHash: string) {
    return this.prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
    });
  }

  revokeRefreshToken(id: string) {
    return this.prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } });
  }

  revokeAllRefreshTokensForPrincipal(type: ActorType, id: string) {
    return this.prisma.refreshToken.updateMany({
      where: { principalType: type, principalId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // --- Password reset tokens ----------------------------------------------

  createPasswordResetToken(input: CreatePasswordResetTokenInput) {
    return this.prisma.passwordResetToken.create({ data: input });
  }

  findValidPasswordResetTokenByHash(tokenHash: string, type: ActorType) {
    return this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        principalType: type,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  markPasswordResetTokenUsed(id: string) {
    return this.prisma.passwordResetToken.update({ where: { id }, data: { usedAt: new Date() } });
  }
}
