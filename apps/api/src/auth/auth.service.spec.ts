import { ConflictException, ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import type { AuthRepository } from "./auth.repository";
import { AuthService } from "./auth.service";
import type { MailService } from "../mail/mail.service";

describe("AuthService", () => {
  let service: AuthService;
  let repo: jest.Mocked<AuthRepository>;
  let jwt: jest.Mocked<JwtService>;
  let mail: jest.Mocked<MailService>;
  let config: ConfigService;

  const meta = { userAgent: "jest", ipAddress: "127.0.0.1" };

  beforeEach(() => {
    repo = {
      findAdminByEmail: jest.fn(),
      findAdminById: jest.fn(),
      updateAdminLastLogin: jest.fn(),
      findMerchantByEmail: jest.fn(),
      findMerchantById: jest.fn(),
      findMerchantByStoreSlug: jest.fn(),
      createMerchant: jest.fn(),
      findCustomerByEmail: jest.fn(),
      findCustomerById: jest.fn(),
      createCustomer: jest.fn(),
      updatePrincipalPasswordHash: jest.fn(),
      createRefreshToken: jest.fn(),
      findValidRefreshTokenByHash: jest.fn(),
      revokeRefreshToken: jest.fn(),
      revokeAllRefreshTokensForPrincipal: jest.fn(),
      createPasswordResetToken: jest.fn(),
      findValidPasswordResetTokenByHash: jest.fn(),
      markPasswordResetTokenUsed: jest.fn(),
    } as unknown as jest.Mocked<AuthRepository>;

    jwt = { signAsync: jest.fn().mockResolvedValue("signed.jwt.token") } as unknown as jest.Mocked<JwtService>;
    mail = { send: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<MailService>;
    config = new ConfigService({
      JWT_ACCESS_SECRET: "test-access-secret",
      JWT_ACCESS_EXPIRES_IN: "15m",
      JWT_REFRESH_EXPIRES_IN: "30d",
      WEB_DOMAIN: "mirakart.test",
      ADMIN_DOMAIN: "admin.mirakart.test",
      MERCHANT_DOMAIN: "seller.mirakart.test",
    });

    service = new AuthService(repo, jwt, config, mail);
  });

  describe("adminLogin", () => {
    it("throws UnauthorizedException when no admin matches the email", async () => {
      repo.findAdminByEmail.mockResolvedValue(null);
      await expect(
        service.adminLogin({ email: "nope@mirakart.test", password: "password1" }, meta),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("throws ForbiddenException when the admin is not ACTIVE", async () => {
      repo.findAdminByEmail.mockResolvedValue({
        id: "a1",
        status: "SUSPENDED",
        passwordHash: await argon2.hash("password1"),
      } as never);
      await expect(
        service.adminLogin({ email: "a@mirakart.test", password: "password1" }, meta),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("throws UnauthorizedException on a wrong password", async () => {
      repo.findAdminByEmail.mockResolvedValue({
        id: "a1",
        status: "ACTIVE",
        passwordHash: await argon2.hash("correct-password1"),
      } as never);
      await expect(
        service.adminLogin({ email: "a@mirakart.test", password: "wrong-password1" }, meta),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("returns tokens and updates lastLoginAt on success", async () => {
      repo.findAdminByEmail.mockResolvedValue({
        id: "a1",
        email: "a@mirakart.test",
        firstName: "Ada",
        lastName: "Admin",
        isSuperAdmin: true,
        status: "ACTIVE",
        passwordHash: await argon2.hash("correct-password1"),
      } as never);
      repo.createRefreshToken.mockResolvedValue({} as never);

      const result = await service.adminLogin(
        { email: "a@mirakart.test", password: "correct-password1" },
        meta,
      );

      expect(result.accessToken).toBe("signed.jwt.token");
      expect(result.refreshToken).toMatch(/^ADMIN\./);
      expect(result.admin.email).toBe("a@mirakart.test");
      expect(repo.updateAdminLastLogin).toHaveBeenCalledWith("a1");
      expect(repo.createRefreshToken).toHaveBeenCalledWith(
        expect.objectContaining({ principalType: "ADMIN", principalId: "a1" }),
      );
    });
  });

  describe("merchantRegister", () => {
    it("throws ConflictException when the email is already taken", async () => {
      repo.findMerchantByEmail.mockResolvedValue({ id: "m1" } as never);
      await expect(
        service.merchantRegister(
          { storeName: "Acme", email: "a@acme.test", password: "password1", phone: "1234567" },
          meta,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it("disambiguates the store slug on collision", async () => {
      repo.findMerchantByEmail.mockResolvedValue(null);
      repo.findMerchantByStoreSlug
        .mockResolvedValueOnce({ id: "existing" } as never) // "acme" taken
        .mockResolvedValueOnce(null); // "acme-2" free
      repo.createMerchant.mockResolvedValue({
        id: "m2",
        email: "a@acme.test",
        storeName: "Acme",
        storeSlug: "acme-2",
        status: "PENDING",
      } as never);
      repo.createRefreshToken.mockResolvedValue({} as never);

      const result = await service.merchantRegister(
        { storeName: "Acme", email: "a@acme.test", password: "password1", phone: "1234567" },
        meta,
      );

      expect(repo.createMerchant).toHaveBeenCalledWith(
        expect.objectContaining({ storeSlug: "acme-2" }),
      );
      expect(result.merchant.status).toBe("PENDING");
    });
  });

  describe("merchantLogin", () => {
    it("allows login while PENDING (frontend routes to the pending-approval page)", async () => {
      repo.findMerchantByEmail.mockResolvedValue({
        id: "m1",
        email: "a@acme.test",
        storeName: "Acme",
        storeSlug: "acme",
        status: "PENDING",
        passwordHash: await argon2.hash("password1"),
      } as never);
      repo.createRefreshToken.mockResolvedValue({} as never);

      const result = await service.merchantLogin({ email: "a@acme.test", password: "password1" }, meta);
      expect(result.merchant.status).toBe("PENDING");
    });

    it("blocks login when SUSPENDED", async () => {
      repo.findMerchantByEmail.mockResolvedValue({
        id: "m1",
        status: "SUSPENDED",
        passwordHash: await argon2.hash("password1"),
      } as never);
      await expect(
        service.merchantLogin({ email: "a@acme.test", password: "password1" }, meta),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe("refresh", () => {
    it("rotates the refresh token and revokes the old one", async () => {
      repo.findValidRefreshTokenByHash.mockResolvedValue({
        id: "rt1",
        principalType: "CUSTOMER",
        principalId: "c1",
      } as never);
      repo.findCustomerById.mockResolvedValue({
        id: "c1",
        email: "c@mirakart.test",
        status: "ACTIVE",
      } as never);
      repo.createRefreshToken.mockResolvedValue({} as never);

      const result = await service.refresh("CUSTOMER.some-raw-token", meta);

      expect(repo.revokeRefreshToken).toHaveBeenCalledWith("rt1");
      expect(result.refreshToken).toMatch(/^CUSTOMER\./);
    });

    it("throws UnauthorizedException for an unknown/expired token", async () => {
      repo.findValidRefreshTokenByHash.mockResolvedValue(null);
      await expect(service.refresh("bogus", meta)).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe("forgotPassword / resetPassword", () => {
    it("does not send an email for an unknown account (avoids enumeration)", async () => {
      repo.findCustomerByEmail.mockResolvedValue(null);
      await service.forgotPassword({ email: "nobody@mirakart.test", principalType: "CUSTOMER" });
      expect(mail.send).not.toHaveBeenCalled();
      expect(repo.createPasswordResetToken).not.toHaveBeenCalled();
    });

    it("sends a reset email and stores a hashed token for a known account", async () => {
      repo.findCustomerByEmail.mockResolvedValue({ id: "c1", email: "c@mirakart.test" } as never);
      await service.forgotPassword({ email: "c@mirakart.test", principalType: "CUSTOMER" });
      expect(repo.createPasswordResetToken).toHaveBeenCalledWith(
        expect.objectContaining({ principalType: "CUSTOMER", principalId: "c1" }),
      );
      expect(mail.send).toHaveBeenCalledWith(
        "c@mirakart.test",
        expect.any(String),
        expect.stringContaining("mirakart.test/reset-password"),
      );
    });

    it("rejects an invalid/expired reset token", async () => {
      repo.findValidPasswordResetTokenByHash.mockResolvedValue(null);
      await expect(
        service.resetPassword({ token: "bad", principalType: "CUSTOMER", newPassword: "newpassword1" }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("updates the password and revokes all sessions on success", async () => {
      repo.findValidPasswordResetTokenByHash.mockResolvedValue({
        id: "prt1",
        principalId: "c1",
      } as never);

      await service.resetPassword({ token: "good", principalType: "CUSTOMER", newPassword: "newpassword1" });

      expect(repo.updatePrincipalPasswordHash).toHaveBeenCalledWith(
        "CUSTOMER",
        "c1",
        expect.any(String),
      );
      expect(repo.markPasswordResetTokenUsed).toHaveBeenCalledWith("prt1");
      expect(repo.revokeAllRefreshTokensForPrincipal).toHaveBeenCalledWith("CUSTOMER", "c1");
    });
  });
});
