import { ConflictException, NotFoundException } from "@nestjs/common";
import { AttributesRepository } from "./attributes.repository";
import { AttributesService } from "./attributes.service";

describe("AttributesService", () => {
  let service: AttributesService;
  let repo: jest.Mocked<AttributesRepository>;

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      addValue: jest.fn(),
      findValueById: jest.fn(),
      deleteValue: jest.fn(),
      countProductUsage: jest.fn(),
      countValueUsage: jest.fn(),
    } as unknown as jest.Mocked<AttributesRepository>;
    service = new AttributesService(repo);
  });

  describe("remove", () => {
    it("blocks deleting an attribute in use by products", async () => {
      repo.findById.mockResolvedValue({ id: "a1", values: [] } as never);
      repo.countProductUsage.mockResolvedValue(4);
      await expect(service.remove("a1")).rejects.toBeInstanceOf(ConflictException);
      expect(repo.delete).not.toHaveBeenCalled();
    });

    it("deletes an unused attribute", async () => {
      repo.findById.mockResolvedValue({ id: "a1", values: [] } as never);
      repo.countProductUsage.mockResolvedValue(0);
      await service.remove("a1");
      expect(repo.delete).toHaveBeenCalledWith("a1");
    });
  });

  describe("removeValue", () => {
    it("throws NotFoundException when the value doesn't belong to the attribute", async () => {
      repo.findValueById.mockResolvedValue({ id: "v1", attributeId: "other-attr" } as never);
      await expect(service.removeValue("a1", "v1")).rejects.toBeInstanceOf(NotFoundException);
    });

    it("blocks deleting a value used by variants", async () => {
      repo.findValueById.mockResolvedValue({ id: "v1", attributeId: "a1" } as never);
      repo.countValueUsage.mockResolvedValue(2);
      await expect(service.removeValue("a1", "v1")).rejects.toBeInstanceOf(ConflictException);
    });

    it("deletes an unused value", async () => {
      repo.findValueById.mockResolvedValue({ id: "v1", attributeId: "a1" } as never);
      repo.countValueUsage.mockResolvedValue(0);
      await service.removeValue("a1", "v1");
      expect(repo.deleteValue).toHaveBeenCalledWith("v1");
    });
  });
});
