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
      findBrandCode: jest.fn().mockResolvedValue(null),
      countByBrand: jest.fn().mockResolvedValue(0),
      create: jest.fn(),
      update: jest.fn(),
      setApprovalStatus: jest.fn(),
      setStatus: jest.fn(),
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

    it("disambiguates the slug and defaults status to APPROVED (live immediately)", async () => {
      repo.findBySlug.mockResolvedValueOnce({ id: "existing" } as never).mockResolvedValueOnce(null);
      repo.create.mockResolvedValue({ id: "p1" } as never);
      await service.create("m1", {
        categoryId: "c1",
        name: "Shoe",
        description: "A nice shoe for everyday wear",
        basePrice: 100,
      });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: "shoe-2", status: "APPROVED", merchantId: "m1", productCode: "PRD-000001" }),
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

    it("blocks a merchant from changing status off SUSPENDED themselves", async () => {
      repo.findById.mockResolvedValue({ id: "p1", merchantId: "m1", status: "SUSPENDED" } as never);
      await expect(service.update("p1", "m1", { status: "APPROVED" })).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it("still allows editing other fields while SUSPENDED, as long as status isn't touched", async () => {
      repo.findById.mockResolvedValue({ id: "p1", merchantId: "m1", status: "SUSPENDED" } as never);
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

  describe("admin visibility levers", () => {
    it("suspend() hides a product regardless of its current status", async () => {
      repo.findByIdWithDetail.mockResolvedValue({ id: "p1", status: "APPROVED" } as never);
      await service.suspend("p1");
      expect(repo.setStatus).toHaveBeenCalledWith("p1", "SUSPENDED");
    });

    it("activate() works from SUSPENDED, unlike approve() which requires PENDING_APPROVAL", async () => {
      repo.findByIdWithDetail.mockResolvedValue({ id: "p1", status: "SUSPENDED" } as never);
      await service.activate("p1", "admin1");
      expect(repo.setApprovalStatus).toHaveBeenCalledWith(
        "p1",
        expect.objectContaining({ status: "APPROVED", approvedById: "admin1" }),
      );
    });

    it("archive() sets ARCHIVED", async () => {
      repo.findByIdWithDetail.mockResolvedValue({ id: "p1", status: "APPROVED" } as never);
      await service.archive("p1");
      expect(repo.setStatus).toHaveBeenCalledWith("p1", "ARCHIVED");
    });
  });
});
