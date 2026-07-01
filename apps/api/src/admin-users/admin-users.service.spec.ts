import { ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import type { AdminUsersRepository } from "./admin-users.repository";
import { AdminUsersService } from "./admin-users.service";

describe("AdminUsersService", () => {
  let service: AdminUsersService;
  let repo: jest.Mocked<AdminUsersRepository>;

  beforeEach(() => {
    repo = {
      findMany: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<AdminUsersRepository>;
    service = new AdminUsersService(repo);
  });

  describe("create", () => {
    it("throws ConflictException when the email is already taken", async () => {
      repo.findByEmail.mockResolvedValue({ id: "a1" } as never);
      await expect(
        service.create({
          email: "a@mirakart.test",
          password: "password1",
          firstName: "A",
          lastName: "B",
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("update", () => {
    it("throws NotFoundException for a missing admin", async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.update("missing", {}, "self")).rejects.toBeInstanceOf(NotFoundException);
    });

    it("prevents self-deactivation", async () => {
      repo.findById.mockResolvedValue({ id: "self" } as never);
      await expect(
        service.update("self", { status: "SUSPENDED" }, "self"),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("allows updating another admin's status", async () => {
      repo.findById.mockResolvedValue({ id: "other" } as never);
      repo.update.mockResolvedValue({ id: "other", status: "SUSPENDED" } as never);
      const result = await service.update("other", { status: "SUSPENDED" }, "self");
      expect(result.status).toBe("SUSPENDED");
    });
  });

  describe("remove", () => {
    it("prevents self-deletion", async () => {
      repo.findById.mockResolvedValue({ id: "self" } as never);
      await expect(service.remove("self", "self")).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.softDelete).not.toHaveBeenCalled();
    });

    it("soft-deletes another admin", async () => {
      repo.findById.mockResolvedValue({ id: "other" } as never);
      await service.remove("other", "self");
      expect(repo.softDelete).toHaveBeenCalledWith("other");
    });
  });
});
