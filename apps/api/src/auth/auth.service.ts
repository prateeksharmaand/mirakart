import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { ActorType } from "@prisma/client";
import * as argon2 from "argon2";
import { AuthRepository } from "./auth.repository";
import type { AdminLoginDto } from "./dto/admin-login.dto";
import type { CustomerLoginDto } from "./dto/customer-login.dto";
import type { CustomerRegisterDto } from "./dto/customer-register.dto";
import type { ForgotPasswordDto } from "./dto/forgot-password.dto";
import type { MerchantLoginDto } from "./dto/merchant-login.dto";
import type { MerchantRegisterDto } from "./dto/merchant-register.dto";
import type { ResetPasswordDto } from "./dto/reset-password.dto";
import { MailService } from "../mail/mail.service";
import type { JwtAccessPayload } from "./types/jwt-payload.interface";
import { parseDurationToMs } from "./utils/duration.util";
import { slugify } from "../common/utils/slugify.util";
import { generateOpaqueToken, hashToken } from "./utils/token.util";

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

interface RequestMeta {
  userAgent?: string;
  ipAddress?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly repo: AuthRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  // --- Admin --------------------------------------------------------------

  async adminLogin(dto: AdminLoginDto, meta: RequestMeta) {
    const admin = await this.repo.findAdminByEmail(dto.email);
    if (!admin) throw new UnauthorizedException("Invalid email or password");
    if (admin.status !== "ACTIVE") {
      throw new ForbiddenException("This admin account is not active");
    }
    const valid = await argon2.verify(admin.passwordHash, dto.password);
    if (!valid) throw new UnauthorizedException("Invalid email or password");

    await this.repo.updateAdminLastLogin(admin.id);
    const tokens = await this.issueTokenPair(admin.id, "ADMIN", admin.email, meta);
    return {
      ...tokens,
      admin: {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        isSuperAdmin: admin.isSuperAdmin,
      },
    };
  }

  // --- Merchant -------------------------------------------------------------

  async merchantRegister(dto: MerchantRegisterDto, meta: RequestMeta) {
    const existing = await this.repo.findMerchantByEmail(dto.email);
    if (existing) throw new ConflictException("Email is already registered");

    const storeSlug = await this.generateUniqueStoreSlug(dto.storeName);
    const passwordHash = await argon2.hash(dto.password);
    const merchant = await this.repo.createMerchant({
      storeName: dto.storeName,
      storeSlug,
      email: dto.email,
      passwordHash,
      phone: dto.phone,
      businessRegistrationNumber: dto.businessRegistrationNumber,
      taxId: dto.taxId,
    });

    const tokens = await this.issueTokenPair(merchant.id, "MERCHANT", merchant.email, meta);
    return {
      ...tokens,
      merchant: {
        id: merchant.id,
        email: merchant.email,
        storeName: merchant.storeName,
        storeSlug: merchant.storeSlug,
        status: merchant.status,
      },
    };
  }

  async merchantLogin(dto: MerchantLoginDto, meta: RequestMeta) {
    const merchant = await this.repo.findMerchantByEmail(dto.email);
    if (!merchant) throw new UnauthorizedException("Invalid email or password");
    if (merchant.status === "SUSPENDED") {
      throw new ForbiddenException("This merchant account has been suspended");
    }
    const valid = await argon2.verify(merchant.passwordHash, dto.password);
    if (!valid) throw new UnauthorizedException("Invalid email or password");

    const tokens = await this.issueTokenPair(merchant.id, "MERCHANT", merchant.email, meta);
    return {
      ...tokens,
      merchant: {
        id: merchant.id,
        email: merchant.email,
        storeName: merchant.storeName,
        storeSlug: merchant.storeSlug,
        status: merchant.status,
      },
    };
  }

  // --- Customer -------------------------------------------------------------

  async customerRegister(dto: CustomerRegisterDto, meta: RequestMeta) {
    const existing = await this.repo.findCustomerByEmail(dto.email);
    if (existing) throw new ConflictException("Email is already registered");

    const passwordHash = await argon2.hash(dto.password);
    const customer = await this.repo.createCustomer({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
    });

    const tokens = await this.issueTokenPair(customer.id, "CUSTOMER", customer.email, meta);
    return {
      ...tokens,
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
      },
    };
  }

  async customerLogin(dto: CustomerLoginDto, meta: RequestMeta) {
    const customer = await this.repo.findCustomerByEmail(dto.email);
    if (!customer) throw new UnauthorizedException("Invalid email or password");
    if (customer.status !== "ACTIVE") {
      throw new ForbiddenException("This account is not active");
    }
    const valid = await argon2.verify(customer.passwordHash, dto.password);
    if (!valid) throw new UnauthorizedException("Invalid email or password");

    const tokens = await this.issueTokenPair(customer.id, "CUSTOMER", customer.email, meta);
    return {
      ...tokens,
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
      },
    };
  }

  // --- Shared: refresh / logout / password reset -----------------------------

  async refresh(refreshToken: string, meta: RequestMeta): Promise<TokenPair> {
    const tokenHash = hashToken(refreshToken);
    const record = await this.repo.findValidRefreshTokenByHash(tokenHash);
    if (!record) throw new UnauthorizedException("Invalid or expired refresh token");

    const principal = await this.findActivePrincipal(record.principalType, record.principalId);
    if (!principal) throw new UnauthorizedException("Account is no longer accessible");

    await this.repo.revokeRefreshToken(record.id);
    return this.issueTokenPair(principal.id, record.principalType, principal.email, meta);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    const record = await this.repo.findValidRefreshTokenByHash(tokenHash);
    if (record) await this.repo.revokeRefreshToken(record.id);
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const principal = await this.findPrincipalByEmail(dto.principalType, dto.email);
    // Always behave the same whether or not the account exists, to avoid
    // leaking which emails are registered.
    if (!principal) return;

    const rawToken = generateOpaqueToken();
    await this.repo.createPasswordResetToken({
      tokenHash: hashToken(rawToken),
      principalType: dto.principalType,
      principalId: principal.id,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    });

    const resetUrl = `${this.resetPasswordBaseUrl(dto.principalType)}?token=${rawToken}&type=${dto.principalType}`;
    await this.mail.send(
      dto.email,
      "Reset your Mirakart password",
      `<p>Click the link below to reset your password. This link expires in 30 minutes.</p>` +
        `<p><a href="${resetUrl}">${resetUrl}</a></p>`,
    );
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const tokenHash = hashToken(dto.token);
    const record = await this.repo.findValidPasswordResetTokenByHash(tokenHash, dto.principalType);
    if (!record) throw new UnauthorizedException("Invalid or expired reset token");

    const passwordHash = await argon2.hash(dto.newPassword);
    await this.repo.updatePrincipalPasswordHash(dto.principalType, record.principalId, passwordHash);
    await this.repo.markPasswordResetTokenUsed(record.id);
    await this.repo.revokeAllRefreshTokensForPrincipal(dto.principalType, record.principalId);
  }

  // --- Internal helpers ------------------------------------------------------

  private async issueTokenPair(
    principalId: string,
    principalType: ActorType,
    email: string,
    meta: RequestMeta,
  ): Promise<TokenPair> {
    const payload: JwtAccessPayload = { sub: principalId, type: principalType, email };
    const accessExpiresIn = this.config.get<string>("JWT_ACCESS_EXPIRES_IN", "15m");
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>("JWT_ACCESS_SECRET"),
      expiresIn: accessExpiresIn,
    });

    const refreshExpiresIn = this.config.get<string>("JWT_REFRESH_EXPIRES_IN", "30d");
    const rawRefreshToken = `${principalType}.${generateOpaqueToken()}`;
    await this.repo.createRefreshToken({
      tokenHash: hashToken(rawRefreshToken),
      principalType,
      principalId,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
      expiresAt: new Date(Date.now() + parseDurationToMs(refreshExpiresIn)),
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: Math.floor(parseDurationToMs(accessExpiresIn) / 1000),
    };
  }

  private async findActivePrincipal(type: ActorType, id: string) {
    switch (type) {
      case "ADMIN": {
        const admin = await this.repo.findAdminById(id);
        return admin && admin.status === "ACTIVE" ? admin : null;
      }
      case "MERCHANT": {
        const merchant = await this.repo.findMerchantById(id);
        return merchant && merchant.status !== "SUSPENDED" ? merchant : null;
      }
      case "CUSTOMER": {
        const customer = await this.repo.findCustomerById(id);
        return customer && customer.status === "ACTIVE" ? customer : null;
      }
      case "SYSTEM":
        return null;
    }
  }

  private async findPrincipalByEmail(type: ActorType, email: string) {
    switch (type) {
      case "ADMIN":
        return this.repo.findAdminByEmail(email);
      case "MERCHANT":
        return this.repo.findMerchantByEmail(email);
      case "CUSTOMER":
        return this.repo.findCustomerByEmail(email);
      case "SYSTEM":
        return null;
    }
  }

  private resetPasswordBaseUrl(type: ActorType): string {
    switch (type) {
      case "ADMIN":
        return `https://${this.config.get<string>("ADMIN_DOMAIN")}/reset-password`;
      case "MERCHANT":
        return `https://${this.config.get<string>("MERCHANT_DOMAIN")}/reset-password`;
      default:
        return `https://${this.config.get<string>("WEB_DOMAIN")}/reset-password`;
    }
  }

  private async generateUniqueStoreSlug(storeName: string): Promise<string> {
    const base = slugify(storeName) || "store";
    let slug = base;
    let suffix = 2;
    while (await this.repo.findMerchantByStoreSlug(slug)) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
    return slug;
  }
}
