import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { ReturnsRepository } from "./returns.repository";
import { ReturnsService } from "./returns.service";

describe("ReturnsService", () => {
  let service: ReturnsService;
  let repo: jest.Mocked<ReturnsRepository>;

  beforeEach(() => {
    repo = {
      findActiveReasons: jest.fn(),
      findOrderItemForReturn: jest.fn(),
      countActiveReturnsForItem: jest.fn(),
      create: jest.fn(),
      findCustomerReturns: jest.fn(),
      findMerchantReturns: jest.fn(),
      findAdminReturns: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
    } as unknown as jest.Mocked<ReturnsRepository>;
    const notifications = { create: jest.fn().mockResolvedValue(undefined) } as never;
    service = new ReturnsService(repo, notifications);
  });

  describe("create", () => {
    it("throws NotFoundException for an order item that isn't the customer's", async () => {
      repo.findOrderItemForReturn.mockResolvedValue(null);
      await expect(
        service.create("c1", { orderItemId: "item1", reasonId: "r1", quantity: 1, imageMediaIds: [] }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("only allows returning a delivered item", async () => {
      repo.findOrderItemForReturn.mockResolvedValue({ status: "SHIPPED", quantity: 1 } as never);
      await expect(
        service.create("c1", { orderItemId: "item1", reasonId: "r1", quantity: 1, imageMediaIds: [] }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rejects a return quantity above what was purchased", async () => {
      repo.findOrderItemForReturn.mockResolvedValue({ status: "DELIVERED", quantity: 1 } as never);
      await expect(
        service.create("c1", { orderItemId: "item1", reasonId: "r1", quantity: 5, imageMediaIds: [] }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("blocks a second active return for the same item", async () => {
      repo.findOrderItemForReturn.mockResolvedValue({ status: "DELIVERED", quantity: 2 } as never);
      repo.countActiveReturnsForItem.mockResolvedValue(1);
      await expect(
        service.create("c1", { orderItemId: "item1", reasonId: "r1", quantity: 1, imageMediaIds: [] }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it("creates a return for a valid request", async () => {
      repo.findOrderItemForReturn.mockResolvedValue({
        status: "DELIVERED",
        quantity: 2,
        orderId: "order1",
        merchantId: "m1",
      } as never);
      repo.countActiveReturnsForItem.mockResolvedValue(0);
      repo.create.mockResolvedValue({ id: "ret1" } as never);

      await service.create("c1", { orderItemId: "item1", reasonId: "r1", quantity: 1, imageMediaIds: [] });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ orderId: "order1", merchantId: "m1", customerId: "c1" }),
      );
    });
  });

  describe("cancel", () => {
    it("hides another customer's return behind NotFoundException", async () => {
      repo.findById.mockResolvedValue({ id: "ret1", customerId: "someone-else" } as never);
      await expect(service.cancel("ret1", "c1")).rejects.toBeInstanceOf(NotFoundException);
    });

    it("blocks cancelling a return that's already past the decision stage", async () => {
      repo.findById.mockResolvedValue({ id: "ret1", customerId: "c1", status: "AWAITING_SHIPMENT" } as never);
      await expect(service.cancel("ret1", "c1")).rejects.toBeInstanceOf(BadRequestException);
    });

    it("cancels a still-pending return", async () => {
      repo.findById.mockResolvedValue({ id: "ret1", customerId: "c1", status: "REQUESTED" } as never);
      await service.cancel("ret1", "c1");
      expect(repo.updateStatus).toHaveBeenCalledWith("ret1", "CANCELLED", "CUSTOMER", "c1");
    });
  });

  describe("merchant decision workflow", () => {
    it("blocks approving a return another merchant owns", async () => {
      repo.findById.mockResolvedValue({ id: "ret1", merchantId: "someone-else" } as never);
      await expect(service.approve("ret1", "m1")).rejects.toBeInstanceOf(NotFoundException);
    });

    it("blocks approving a return that's already decided", async () => {
      repo.findById.mockResolvedValue({ id: "ret1", merchantId: "m1", status: "AWAITING_SHIPMENT" } as never);
      await expect(service.approve("ret1", "m1")).rejects.toBeInstanceOf(BadRequestException);
    });

    it("approves a pending return", async () => {
      repo.findById.mockResolvedValue({ id: "ret1", merchantId: "m1", status: "REQUESTED" } as never);
      await service.approve("ret1", "m1");
      expect(repo.updateStatus).toHaveBeenCalledWith("ret1", "AWAITING_SHIPMENT", "MERCHANT", "m1");
    });

    it("enforces ITEM_RECEIVED only follows AWAITING_SHIPMENT", async () => {
      repo.findById.mockResolvedValue({ id: "ret1", merchantId: "m1", status: "REQUESTED" } as never);
      await expect(
        service.merchantUpdateStatus("ret1", "m1", { status: "ITEM_RECEIVED" }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("enforces COMPLETED only follows ITEM_RECEIVED", async () => {
      repo.findById.mockResolvedValue({ id: "ret1", merchantId: "m1", status: "AWAITING_SHIPMENT" } as never);
      await expect(
        service.merchantUpdateStatus("ret1", "m1", { status: "COMPLETED" }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("allows the correct sequential transition", async () => {
      repo.findById.mockResolvedValue({ id: "ret1", merchantId: "m1", status: "AWAITING_SHIPMENT" } as never);
      await service.merchantUpdateStatus("ret1", "m1", { status: "ITEM_RECEIVED" });
      expect(repo.updateStatus).toHaveBeenCalledWith("ret1", "ITEM_RECEIVED", "MERCHANT", "m1");
    });
  });

  describe("adminOverride", () => {
    it("throws NotFoundException for a missing return", async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.adminOverride("missing", "a1", { status: "COMPLETED" })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("allows an admin to set any status with an optional refund amount", async () => {
      repo.findById.mockResolvedValue({ id: "ret1" } as never);
      await service.adminOverride("ret1", "a1", { status: "COMPLETED", refundAmount: 499, note: "manual review" });
      expect(repo.updateStatus).toHaveBeenCalledWith("ret1", "COMPLETED", "ADMIN", "a1", "manual review", 499);
    });
  });
});
