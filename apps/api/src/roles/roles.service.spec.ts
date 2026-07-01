import { ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import type { RolesRepository } from "./roles.repository";
import { RolesService } from "./roles.service";

describe("RolesService", () => {
  let service: RolesService;
  let repo: jest.Mocked<RolesRepository>;

  beforeEach(() => {
    repo = {
      findMany: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      countAdminsWithRole: jest.fn(),
    } as unknown as jest.Mocked<RolesRepository>;
    service = new RolesService(repo);
  });

  describe("create", () => {
    it("throws ConflictException on a duplicate name", async () => {
      repo.findByName.mockResolvedValue({ id: "r1" } as never);
      await expect(service.create({ name: "Support", permissionIds: [] })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe("remove", () => {
    it("throws NotFoundException for a missing role", async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.remove("missing")).rejects.toBeInstanceOf(NotFoundException);
    });

    it("blocks deleting a system role", async () => {
      repo.findById.mockResolvedValue({ id: "r1", isSystem: true } as never);
      await expect(service.remove("r1")).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("blocks deleting a role with assigned admins", async () => {
      repo.findById.mockResolvedValue({ id: "r1", isSystem: false } as never);
      repo.countAdminsWithRole.mockResolvedValue(3);
      await expect(service.remove("r1")).rejects.toBeInstanceOf(ConflictException);
      expect(repo.delete).not.toHaveBeenCalled();
    });

    it("deletes a role with no assignments", async () => {
      repo.findById.mockResolvedValue({ id: "r1", isSystem: false } as never);
      repo.countAdminsWithRole.mockResolvedValue(0);
      await service.remove("r1");
      expect(repo.delete).toHaveBeenCalledWith("r1");
    });
  });
});
