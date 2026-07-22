import { ConflictException } from "@nestjs/common";
import { BrandsRepository } from "./brands.repository";
import { BrandsService } from "./brands.service";

describe("BrandsService", () => {
  let service: BrandsService;
  let repo: jest.Mocked<BrandsRepository>;

  beforeEach(() => {
    repo = {
      findAllActive: jest.fn(),
      findAllForAdmin: jest.fn(),
      findBySlug: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      countActiveProducts: jest.fn(),
    } as unknown as jest.Mocked<BrandsRepository>;
    service = new BrandsService(repo);
  });

  it("disambiguates the slug on collision", async () => {
    repo.findBySlug.mockResolvedValueOnce({ id: "existing" } as never).mockResolvedValueOnce(null);
    repo.create.mockResolvedValue({ id: "b1", slug: "nike-2" } as never);
    await service.create({ name: "Nike" });
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ slug: "nike-2" }));
  });

  it("blocks deleting a brand with active products", async () => {
    repo.findById.mockResolvedValue({ id: "b1" } as never);
    repo.countActiveProducts.mockResolvedValue(3);
    await expect(service.remove("b1")).rejects.toBeInstanceOf(ConflictException);
    expect(repo.softDelete).not.toHaveBeenCalled();
  });

  it("deletes a brand with no products", async () => {
    repo.findById.mockResolvedValue({ id: "b1" } as never);
    repo.countActiveProducts.mockResolvedValue(0);
    await service.remove("b1");
    expect(repo.softDelete).toHaveBeenCalledWith("b1");
  });
});
