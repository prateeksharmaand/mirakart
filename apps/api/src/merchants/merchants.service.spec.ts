import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { MerchantsRepository } from "./merchants.repository";
import { MerchantsService } from "./merchants.service";

describe("MerchantsService", () => {
  let service: MerchantsService;
  let repo: jest.Mocked<MerchantsRepository>;

  beforeEach(() => {
    repo = {
      findMany: jest.fn(),
      findById: jest.fn(),
      updateProfile: jest.fn(),
      setStatus: jest.fn(),
      createDocument: jest.fn(),
      findDocuments: jest.fn(),
      findDocumentById: jest.fn(),
      updateDocumentStatus: jest.fn(),
    } as unknown as jest.Mocked<MerchantsRepository>;
    const notifications = { create: jest.fn().mockResolvedValue(undefined) } as never;
    service = new MerchantsService(repo, notifications);
  });

  describe("approve", () => {
    it("throws NotFoundException for a missing merchant", async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.approve("missing", "admin1")).rejects.toBeInstanceOf(NotFoundException);
    });

    it("throws ConflictException if already approved", async () => {
      repo.findById.mockResolvedValue({ id: "m1", status: "APPROVED" } as never);
      await expect(service.approve("m1", "admin1")).rejects.toBeInstanceOf(ConflictException);
    });

    it("refuses to approve a suspended merchant directly", async () => {
      repo.findById.mockResolvedValue({ id: "m1", status: "SUSPENDED" } as never);
      await expect(service.approve("m1", "admin1")).rejects.toBeInstanceOf(BadRequestException);
    });

    it("approves a pending merchant", async () => {
      repo.findById.mockResolvedValue({ id: "m1", status: "PENDING" } as never);
      repo.setStatus.mockResolvedValue({ id: "m1", status: "APPROVED" } as never);
      await service.approve("m1", "admin1");
      expect(repo.setStatus).toHaveBeenCalledWith(
        "m1",
        expect.objectContaining({ status: "APPROVED", approvedById: "admin1" }),
      );
    });

    it("re-approves a previously rejected merchant", async () => {
      repo.findById.mockResolvedValue({ id: "m1", status: "REJECTED" } as never);
      repo.setStatus.mockResolvedValue({ id: "m1", status: "APPROVED" } as never);
      await service.approve("m1", "admin1");
      expect(repo.setStatus).toHaveBeenCalled();
    });
  });

  describe("reject", () => {
    it("only allows rejecting a PENDING merchant", async () => {
      repo.findById.mockResolvedValue({ id: "m1", status: "APPROVED" } as never);
      await expect(service.reject("m1", "admin1", "bad docs")).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rejects a pending merchant with a reason", async () => {
      repo.findById.mockResolvedValue({ id: "m1", status: "PENDING" } as never);
      await service.reject("m1", "admin1", "bad docs");
      expect(repo.setStatus).toHaveBeenCalledWith(
        "m1",
        expect.objectContaining({ status: "REJECTED", rejectionReason: "bad docs" }),
      );
    });
  });

  describe("suspend", () => {
    it("only allows suspending an APPROVED merchant", async () => {
      repo.findById.mockResolvedValue({ id: "m1", status: "PENDING" } as never);
      await expect(service.suspend("m1")).rejects.toBeInstanceOf(BadRequestException);
    });

    it("suspends an approved merchant", async () => {
      repo.findById.mockResolvedValue({ id: "m1", status: "APPROVED" } as never);
      await service.suspend("m1");
      expect(repo.setStatus).toHaveBeenCalledWith("m1", { status: "SUSPENDED" });
    });
  });
});
