import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { InsufficientReplacementStockError, ReturnsRepository } from "./returns.repository";
import { ReturnsService } from "./returns.service";

describe("ReturnsService", () => {
  let service: ReturnsService;
  let repo: jest.Mocked<ReturnsRepository>;

  beforeEach(() => {
    repo = {
      findActiveReasons: jest.fn(),
      findOrderItemForReturn: jest.fn(),
      findVariantById: jest.fn(),
      findReplacementVariants: jest.fn(),
      countActiveReturnsForItem: jest.fn(),
      create: jest.fn(),
      findCustomerReturns: jest.fn(),
      findMerchantReturns: jest.fn(),
      findAdminReturns: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
      approveReturn: jest.fn(),
      markItemReceived: jest.fn(),
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

    it("creates a refund return for a valid request", async () => {
      repo.findOrderItemForReturn.mockResolvedValue({
        status: "DELIVERED",
        quantity: 2,
        orderId: "order1",
        merchantId: "m1",
        variant: { id: "v1", productId: "p1" },
      } as never);
      repo.countActiveReturnsForItem.mockResolvedValue(0);
      repo.create.mockResolvedValue({ id: "ret1" } as never);

      await service.create("c1", { orderItemId: "item1", reasonId: "r1", quantity: 1, imageMediaIds: [] });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ orderId: "order1", merchantId: "m1", customerId: "c1", resolutionType: "REFUND" }),
      );
    });

    it("requires a replacementVariantId for a replacement request", async () => {
      repo.findOrderItemForReturn.mockResolvedValue({
        status: "DELIVERED",
        quantity: 1,
        variant: { id: "v1", productId: "p1" },
      } as never);
      repo.countActiveReturnsForItem.mockResolvedValue(0);
      await expect(
        service.create("c1", {
          orderItemId: "item1",
          reasonId: "r1",
          quantity: 1,
          imageMediaIds: [],
          resolutionType: "REPLACEMENT",
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rejects a replacement variant that belongs to a different product", async () => {
      repo.findOrderItemForReturn.mockResolvedValue({
        status: "DELIVERED",
        quantity: 1,
        variant: { id: "v1", productId: "p1" },
      } as never);
      repo.countActiveReturnsForItem.mockResolvedValue(0);
      repo.findVariantById.mockResolvedValue({ id: "v2", productId: "p-other" } as never);
      await expect(
        service.create("c1", {
          orderItemId: "item1",
          reasonId: "r1",
          quantity: 1,
          imageMediaIds: [],
          resolutionType: "REPLACEMENT",
          replacementVariantId: "v2",
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("creates a replacement return when the variant matches the same product", async () => {
      repo.findOrderItemForReturn.mockResolvedValue({
        status: "DELIVERED",
        quantity: 1,
        orderId: "order1",
        merchantId: "m1",
        variant: { id: "v1", productId: "p1" },
      } as never);
      repo.countActiveReturnsForItem.mockResolvedValue(0);
      repo.findVariantById.mockResolvedValue({ id: "v2", productId: "p1" } as never);
      repo.create.mockResolvedValue({ id: "ret1" } as never);

      await service.create("c1", {
        orderItemId: "item1",
        reasonId: "r1",
        quantity: 1,
        imageMediaIds: [],
        resolutionType: "REPLACEMENT",
        replacementVariantId: "v2",
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ resolutionType: "REPLACEMENT", replacementVariantId: "v2" }),
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

    it("approves a pending refund return with no stock decrement", async () => {
      repo.findById.mockResolvedValue({
        id: "ret1", merchantId: "m1", status: "REQUESTED", resolutionType: "REFUND", quantity: 1,
      } as never);
      repo.approveReturn.mockResolvedValue({ id: "ret1" } as never);
      await service.approve("ret1", "m1");
      expect(repo.approveReturn).toHaveBeenCalledWith("ret1", "m1", null, 1);
    });

    it("approves a pending replacement return, decrementing the replacement variant's stock", async () => {
      repo.findById.mockResolvedValue({
        id: "ret1", merchantId: "m1", status: "REQUESTED", resolutionType: "REPLACEMENT",
        replacementVariantId: "v2", quantity: 2,
      } as never);
      repo.approveReturn.mockResolvedValue({ id: "ret1" } as never);
      await service.approve("ret1", "m1");
      expect(repo.approveReturn).toHaveBeenCalledWith("ret1", "m1", "v2", 2);
    });

    it("surfaces insufficient replacement stock as a BadRequestException", async () => {
      repo.findById.mockResolvedValue({
        id: "ret1", merchantId: "m1", status: "REQUESTED", resolutionType: "REPLACEMENT",
        replacementVariantId: "v2", quantity: 5,
      } as never);
      repo.approveReturn.mockRejectedValue(new InsufficientReplacementStockError("v2"));
      await expect(service.approve("ret1", "m1")).rejects.toBeInstanceOf(BadRequestException);
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

    it("restocks the original variant when marking a refund return ITEM_RECEIVED", async () => {
      repo.findById.mockResolvedValue({
        id: "ret1", merchantId: "m1", status: "AWAITING_SHIPMENT", quantity: 3,
        resolutionType: "REFUND", orderItem: { variantId: "v1" },
      } as never);
      await service.merchantUpdateStatus("ret1", "m1", { status: "ITEM_RECEIVED" });
      expect(repo.markItemReceived).toHaveBeenCalledWith("ret1", "m1", "v1", 3);
    });

    it("restocks the original variant when marking a replacement return ITEM_RECEIVED", async () => {
      repo.findById.mockResolvedValue({
        id: "ret1", merchantId: "m1", status: "AWAITING_SHIPMENT", quantity: 1,
        resolutionType: "REPLACEMENT", replacementVariantId: "v2", orderItem: { variantId: "v1" },
      } as never);
      await service.merchantUpdateStatus("ret1", "m1", { status: "ITEM_RECEIVED" });
      // Restocks the ORIGINAL variant (v1), not the replacement (v2) — those are separate stock movements.
      expect(repo.markItemReceived).toHaveBeenCalledWith("ret1", "m1", "v1", 1);
    });

    it("allows the COMPLETED transition after ITEM_RECEIVED via the generic status update", async () => {
      repo.findById.mockResolvedValue({ id: "ret1", merchantId: "m1", status: "ITEM_RECEIVED" } as never);
      await service.merchantUpdateStatus("ret1", "m1", { status: "COMPLETED" });
      expect(repo.updateStatus).toHaveBeenCalledWith("ret1", "COMPLETED", "MERCHANT", "m1");
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

  describe("listReplacementOptions", () => {
    it("throws NotFoundException when the order item isn't the customer's", async () => {
      repo.findOrderItemForReturn.mockResolvedValue(null);
      await expect(service.listReplacementOptions("item1", "c1")).rejects.toBeInstanceOf(NotFoundException);
    });

    it("returns sibling variants of the purchased product", async () => {
      repo.findOrderItemForReturn.mockResolvedValue({ variant: { id: "v1", productId: "p1" } } as never);
      repo.findReplacementVariants.mockResolvedValue([{ id: "v1" }, { id: "v2" }] as never);
      const result = await service.listReplacementOptions("item1", "c1");
      expect(repo.findReplacementVariants).toHaveBeenCalledWith("p1");
      expect(result).toHaveLength(2);
    });
  });
});
