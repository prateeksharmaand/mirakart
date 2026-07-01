import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { MediaRepository } from "../storage/media.repository";
import { StorageService } from "../storage/storage.service";
import { UploadsService } from "./uploads.service";

describe("UploadsService", () => {
  let service: UploadsService;
  let storage: jest.Mocked<StorageService>;
  let media: jest.Mocked<MediaRepository>;

  const merchant = { id: "m1", type: "MERCHANT" as const, email: "m@mirakart.test" };
  const customer = { id: "c1", type: "CUSTOMER" as const, email: "c@mirakart.test" };
  const admin = { id: "a1", type: "ADMIN" as const, email: "a@mirakart.test" };

  const file = {
    originalname: "photo.jpg",
    mimetype: "image/jpeg",
    size: 1024,
    buffer: Buffer.from("fake"),
  };

  beforeEach(() => {
    storage = { upload: jest.fn(), delete: jest.fn(), getUrl: jest.fn() } as unknown as jest.Mocked<StorageService>;
    media = { create: jest.fn(), findById: jest.fn(), delete: jest.fn() } as unknown as jest.Mocked<MediaRepository>;
    service = new UploadsService(storage, media);
  });

  describe("upload", () => {
    it("throws BadRequestException when no file is provided", async () => {
      await expect(service.upload("PRODUCT_IMAGES", undefined, merchant)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it("rejects a principal type not allowed for the purpose", async () => {
      await expect(service.upload("PRODUCT_IMAGES", file, customer)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it("rejects a disallowed mime type", async () => {
      await expect(
        service.upload("PRODUCT_IMAGES", { ...file, mimetype: "application/zip" }, merchant),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rejects a file over the size limit", async () => {
      await expect(
        service.upload("PRODUCT_IMAGES", { ...file, size: 6 * 1024 * 1024 }, merchant),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("uploads and creates a Media record on success", async () => {
      storage.upload.mockResolvedValue({
        bucket: "product-images",
        objectKey: "abc.jpg",
        url: "http://localhost:9000/product-images/abc.jpg",
      });
      media.create.mockResolvedValue({ id: "media1" } as never);

      const result = await service.upload("PRODUCT_IMAGES", file, merchant);

      expect(storage.upload).toHaveBeenCalledWith("product-images", "photo.jpg", file.buffer, "image/jpeg");
      expect(media.create).toHaveBeenCalledWith(
        expect.objectContaining({ uploadedByType: "MERCHANT", uploadedById: "m1" }),
      );
      expect(result).toEqual({ id: "media1" });
    });

    it("allows BANNERS uploads only for ADMIN", async () => {
      await expect(service.upload("BANNERS", file, merchant)).rejects.toBeInstanceOf(ForbiddenException);
      storage.upload.mockResolvedValue({ bucket: "banners", objectKey: "x.jpg", url: "http://x" });
      media.create.mockResolvedValue({ id: "media2" } as never);
      await expect(service.upload("BANNERS", file, admin)).resolves.toEqual({ id: "media2" });
    });
  });

  describe("remove", () => {
    it("throws NotFoundException for a missing media record", async () => {
      media.findById.mockResolvedValue(null);
      await expect(service.remove("missing", merchant)).rejects.toBeInstanceOf(NotFoundException);
    });

    it("allows the uploader to delete their own file", async () => {
      media.findById.mockResolvedValue({
        id: "media1",
        bucket: "product-images",
        objectKey: "abc.jpg",
        uploadedByType: "MERCHANT",
        uploadedById: "m1",
      } as never);
      await service.remove("media1", merchant);
      expect(storage.delete).toHaveBeenCalledWith("product-images", "abc.jpg");
      expect(media.delete).toHaveBeenCalledWith("media1");
    });

    it("blocks deleting another principal's file", async () => {
      media.findById.mockResolvedValue({
        id: "media1",
        uploadedByType: "MERCHANT",
        uploadedById: "someone-else",
      } as never);
      await expect(service.remove("media1", merchant)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("allows an admin to delete any file", async () => {
      media.findById.mockResolvedValue({
        id: "media1",
        bucket: "product-images",
        objectKey: "abc.jpg",
        uploadedByType: "MERCHANT",
        uploadedById: "someone-else",
      } as never);
      await service.remove("media1", admin);
      expect(media.delete).toHaveBeenCalledWith("media1");
    });
  });
});
