import { ConflictException, NotFoundException } from "@nestjs/common";
import { CategoriesRepository } from "./categories.repository";
import { CategoriesService } from "./categories.service";

describe("CategoriesService", () => {
  let service: CategoriesService;
  let repo: jest.Mocked<CategoriesRepository>;

  beforeEach(() => {
    repo = {
      findAllActive: jest.fn(),
      findAllForAdmin: jest.fn(),
      findBySlug: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      countChildren: jest.fn(),
      countActiveProducts: jest.fn(),
    } as unknown as jest.Mocked<CategoriesRepository>;
    service = new CategoriesService(repo);
  });

  describe("list", () => {
    it("returns a flat list when flat=true", async () => {
      repo.findAllActive.mockResolvedValue([
        { id: "1", parentId: null } as never,
        { id: "2", parentId: "1" } as never,
      ]);
      const result = await service.list(true);
      expect(result).toHaveLength(2);
    });

    it("builds a nested tree when flat=false", async () => {
      repo.findAllActive.mockResolvedValue([
        { id: "1", parentId: null } as never,
        { id: "2", parentId: "1" } as never,
        { id: "3", parentId: "1" } as never,
        { id: "4", parentId: null } as never,
      ]);
      const tree = (await service.list(false)) as Array<{ id: string; children: unknown[] }>;
      expect(tree).toHaveLength(2);
      const root1 = tree.find((c) => c.id === "1")!;
      expect(root1.children).toHaveLength(2);
    });
  });

  describe("create", () => {
    it("validates the parent exists", async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.create({ name: "Shoes", parentId: "missing-parent" })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("disambiguates the slug on collision", async () => {
      repo.findBySlug.mockResolvedValueOnce({ id: "existing" } as never).mockResolvedValueOnce(null);
      repo.create.mockResolvedValue({ id: "c1", slug: "shoes-2" } as never);
      await service.create({ name: "Shoes" });
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ slug: "shoes-2" }));
    });
  });

  describe("update", () => {
    it("refuses to set a category as its own parent", async () => {
      repo.findById.mockResolvedValue({ id: "c1" } as never);
      await expect(service.update("c1", { parentId: "c1" })).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("remove", () => {
    it("blocks deleting a category with subcategories", async () => {
      repo.findById.mockResolvedValue({ id: "c1" } as never);
      repo.countChildren.mockResolvedValue(2);
      repo.countActiveProducts.mockResolvedValue(0);
      await expect(service.remove("c1")).rejects.toBeInstanceOf(ConflictException);
      expect(repo.softDelete).not.toHaveBeenCalled();
    });

    it("blocks deleting a category with active products", async () => {
      repo.findById.mockResolvedValue({ id: "c1" } as never);
      repo.countChildren.mockResolvedValue(0);
      repo.countActiveProducts.mockResolvedValue(5);
      await expect(service.remove("c1")).rejects.toBeInstanceOf(ConflictException);
    });

    it("deletes an empty leaf category", async () => {
      repo.findById.mockResolvedValue({ id: "c1" } as never);
      repo.countChildren.mockResolvedValue(0);
      repo.countActiveProducts.mockResolvedValue(0);
      await service.remove("c1");
      expect(repo.softDelete).toHaveBeenCalledWith("c1");
    });
  });
});
