import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { ProductsRepository } from "./products.repository";
import { ProductsService } from "./products.service";

describe("ProductsService", () => {
  let service: ProductsService;
  let repo: jest.Mocked<ProductsRepository>;

  beforeEach(() => {
    repo = {
      findPublicList: jest.fn(),
      findPublicBySlug: jest.fn(),
      findMerchantList: jest.fn(),
      findAdminList: jest.fn(),
      findById: jest.fn(),
      findByIdWithDetail: jest.fn(),
      findBySlug: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      setApprovalStatus: jest.fn(),
      softDelete: jest.fn(),
      findVariantById: jest.fn(),
      findVariantBySku: jest.fn(),
      createVariant: jest.fn(),
      updateVariant: jest.fn(),
      softDeleteVariant: jest.fn(),
      countActiveVariants: jest.fn(),
      upsertInventory: jest.fn(),
      addImage: jest.fn(),
      findImageById: jest.fn(),
      removeImage: jest.fn(),
      countImages: jest.fn(),
    } as unknown as jest.Mocked<ProductsRepository>;
    service = new ProductsService(repo);
  });

  describe("create", () => {
    it("rejects compareAtPrice <= basePrice", async () => {
      await expect(
        service.create("m1", {
          categoryId: "c1",
          name: "Shoe",
          description: "A nice shoe for everyday wear",
          basePrice: 100,
          compareAtPrice: 100,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("disambiguates the slug and defaults status to DRAFT", async () => {
      repo.findBySlug.mockResolvedValueOnce({ id: "existing" } as never).mockResolvedValueOnce(null);
      repo.create.mockResolvedValue({ id: "p1" } as never);
      await service.create("m1", {
        categoryId: "c1",
        name: "Shoe",
        description: "A nice shoe for everyday wear",
        basePrice: 100,
      });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: "shoe-2", status: "DRAFT", merchantId: "m1" }),
      );
    });
  });

  describe("ownership checks", () => {
    it("hides another merchant's product behind NotFoundException", async () => {
      repo.findById.mockResolvedValue({ id: "p1", merchantId: "someone-else" } as never);
      await expect(service.update("p1", "m1", {})).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it("allows updating your own product and auto-resubmits if it was REJECTED", async () => {
      repo.findById.mockResolvedValue({ id: "p1", merchantId: "m1", status: "REJECTED" } as never);
      repo.update.mockResolvedValue({ id: "p1" } as never);
      await service.update("p1", "m1", { name: "New name" });
      expect(repo.update).toHaveBeenCalledWith(
        "p1",
        expect.objectContaining({ name: "New name", status: "PENDING_APPROVAL", rejectionReason: null }),
      );
    });

    it("leaves status untouched when updating a DRAFT product", async () => {
      repo.findById.mockResolvedValue({ id: "p1", merchantId: "m1", status: "DRAFT" } as never);
      repo.update.mockResolvedValue({ id: "p1" } as never);
      await service.update("p1", "m1", { name: "New name" });
      expect(repo.update).toHaveBeenCalledWith("p1", { name: "New name" });
    });

    it("blocks a variant operation on another merchant's product", async () => {
      repo.findById.mockResolvedValue({ id: "p1", merchantId: "someone-else" } as never);
      await expect(
        service.addVariant("p1", "m1", { sku: "SKU1", price: 10, attributeValueIds: ["v1"] }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("addVariant", () => {
    it("rejects a duplicate SKU", async () => {
      repo.findById.mockResolvedValue({ id: "p1", merchantId: "m1" } as never);
      repo.findVariantBySku.mockResolvedValue({ id: "existing" } as never);
      await expect(
        service.addVariant("p1", "m1", { sku: "DUPE", price: 10, attributeValueIds: ["v1"] }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("approval workflow", () => {
    it("only allows approving a PENDING_APPROVAL product", async () => {
      repo.findByIdWithDetail.mockResolvedValue({ id: "p1", status: "DRAFT" } as never);
      await expect(service.approve("p1", "admin1")).rejects.toBeInstanceOf(BadRequestException);
    });

    it("approves a pending product", async () => {
      repo.findByIdWithDetail.mockResolvedValue({ id: "p1", status: "PENDING_APPROVAL" } as never);
      await service.approve("p1", "admin1");
      expect(repo.setApprovalStatus).toHaveBeenCalledWith(
        "p1",
        expect.objectContaining({ status: "APPROVED", approvedById: "admin1" }),
      );
    });

    it("only allows rejecting a PENDING_APPROVAL product", async () => {
      repo.findByIdWithDetail.mockResolvedValue({ id: "p1", status: "DRAFT" } as never);
      await expect(service.reject("p1", "admin1", "bad photos")).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
