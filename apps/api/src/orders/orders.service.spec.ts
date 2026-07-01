import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { CartRepository } from "../cart/cart.repository";
import { InsufficientStockError, OrdersRepository } from "./orders.repository";
import { OrdersService } from "./orders.service";

describe("OrdersService", () => {
  let service: OrdersService;
  let repo: jest.Mocked<OrdersRepository>;
  let cartRepo: jest.Mocked<CartRepository>;

  const approvedVariant = {
    id: "v1",
    sku: "SKU1",
    price: 100,
    productId: "p1",
    product: { id: "p1", name: "Shoe", status: "APPROVED", deletedAt: null, merchantId: "m1" },
    inventory: { quantity: 10 },
    attributeValues: [],
  };

  beforeEach(() => {
    repo = {
      findAddressForCustomer: jest.fn(),
      findVariantForCheckout: jest.fn(),
      createOrder: jest.fn(),
      findCustomerOrders: jest.fn(),
      findAdminOrders: jest.fn(),
      findMerchantOrders: jest.fn(),
      findOrderDetail: jest.fn(),
      findOrderItemById: jest.fn(),
      updateOrderItemStatus: jest.fn(),
      updateOrderStatus: jest.fn(),
    } as unknown as jest.Mocked<OrdersRepository>;
    cartRepo = {
      findCartWithItems: jest.fn(),
      clearItems: jest.fn(),
    } as unknown as jest.Mocked<CartRepository>;
    const notifications = { create: jest.fn().mockResolvedValue(undefined) } as never;
    service = new OrdersService(repo, cartRepo, notifications);
  });

  describe("checkout", () => {
    const dto = { shippingAddressId: "addr1", billingAddressId: "addr1", paymentMethod: "COD" as const };

    it("throws NotFoundException for an address that isn't the customer's", async () => {
      repo.findAddressForCustomer.mockResolvedValue(null);
      await expect(service.checkout("c1", dto)).rejects.toBeInstanceOf(NotFoundException);
    });

    it("throws BadRequestException for an empty cart", async () => {
      repo.findAddressForCustomer.mockResolvedValue({ id: "addr1" } as never);
      cartRepo.findCartWithItems.mockResolvedValue({ id: "cart1", items: [] } as never);
      await expect(service.checkout("c1", dto)).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rejects checkout when a cart item is out of stock", async () => {
      repo.findAddressForCustomer.mockResolvedValue({ id: "addr1" } as never);
      cartRepo.findCartWithItems.mockResolvedValue({
        id: "cart1",
        items: [{ variantId: "v1", quantity: 20 }],
      } as never);
      repo.findVariantForCheckout.mockResolvedValue(approvedVariant as never);
      await expect(service.checkout("c1", dto)).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rejects checkout when the product is no longer approved", async () => {
      repo.findAddressForCustomer.mockResolvedValue({ id: "addr1" } as never);
      cartRepo.findCartWithItems.mockResolvedValue({
        id: "cart1",
        items: [{ variantId: "v1", quantity: 1 }],
      } as never);
      repo.findVariantForCheckout.mockResolvedValue({
        ...approvedVariant,
        product: { ...approvedVariant.product, status: "PENDING_APPROVAL" },
      } as never);
      await expect(service.checkout("c1", dto)).rejects.toBeInstanceOf(BadRequestException);
    });

    it("creates the order, clears the cart, and splits lines by merchant", async () => {
      repo.findAddressForCustomer.mockResolvedValue({ id: "addr1" } as never);
      cartRepo.findCartWithItems.mockResolvedValue({
        id: "cart1",
        items: [{ variantId: "v1", quantity: 2 }],
      } as never);
      repo.findVariantForCheckout.mockResolvedValue(approvedVariant as never);
      repo.createOrder.mockResolvedValue({ id: "order1" } as never);

      const result = await service.checkout("c1", dto);

      expect(repo.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: "c1",
          paymentMethod: "COD",
          lines: [expect.objectContaining({ merchantId: "m1", variantId: "v1", quantity: 2, unitPrice: 100 })],
        }),
      );
      expect(cartRepo.clearItems).toHaveBeenCalledWith("cart1");
      expect(result).toEqual({ id: "order1" });
    });

    it("translates a race-condition stock failure into ConflictException and doesn't clear the cart", async () => {
      repo.findAddressForCustomer.mockResolvedValue({ id: "addr1" } as never);
      cartRepo.findCartWithItems.mockResolvedValue({
        id: "cart1",
        items: [{ variantId: "v1", quantity: 2 }],
      } as never);
      repo.findVariantForCheckout.mockResolvedValue(approvedVariant as never);
      repo.createOrder.mockRejectedValue(new InsufficientStockError("v1"));

      await expect(service.checkout("c1", dto)).rejects.toBeInstanceOf(ConflictException);
      expect(cartRepo.clearItems).not.toHaveBeenCalled();
    });

    it("retries with a new order number on a unique-constraint collision", async () => {
      repo.findAddressForCustomer.mockResolvedValue({ id: "addr1" } as never);
      cartRepo.findCartWithItems.mockResolvedValue({
        id: "cart1",
        items: [{ variantId: "v1", quantity: 1 }],
      } as never);
      repo.findVariantForCheckout.mockResolvedValue(approvedVariant as never);

      const collision = new Prisma.PrismaClientKnownRequestError("dup", {
        code: "P2002",
        clientVersion: "5.x",
        meta: { target: ["orderNumber"] },
      });
      repo.createOrder.mockRejectedValueOnce(collision).mockResolvedValueOnce({ id: "order1" } as never);

      const result = await service.checkout("c1", dto);
      expect(repo.createOrder).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ id: "order1" });
    });
  });

  describe("updateItemStatus", () => {
    it("throws NotFoundException for an item not on that order", async () => {
      repo.findOrderItemById.mockResolvedValue({ id: "item1", orderId: "other-order" } as never);
      await expect(
        service.updateItemStatus("order1", "item1", "SHIPPED", { type: "ADMIN", id: "a1" }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("blocks a merchant updating another merchant's item", async () => {
      repo.findOrderItemById.mockResolvedValue({ id: "item1", orderId: "order1", merchantId: "m1" } as never);
      await expect(
        service.updateItemStatus("order1", "item1", "SHIPPED", { type: "MERCHANT", id: "m2" }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("allows the owning merchant to update their item", async () => {
      repo.findOrderItemById.mockResolvedValue({ id: "item1", orderId: "order1", merchantId: "m1" } as never);
      await service.updateItemStatus("order1", "item1", "SHIPPED", { type: "MERCHANT", id: "m1" });
      expect(repo.updateOrderItemStatus).toHaveBeenCalledWith("item1", "SHIPPED");
    });

    it("allows an admin to update any item", async () => {
      repo.findOrderItemById.mockResolvedValue({ id: "item1", orderId: "order1", merchantId: "m1" } as never);
      await service.updateItemStatus("order1", "item1", "SHIPPED", { type: "ADMIN", id: "a1" });
      expect(repo.updateOrderItemStatus).toHaveBeenCalledWith("item1", "SHIPPED");
    });
  });

  describe("findForMerchant", () => {
    it("throws NotFoundException when the order has none of this merchant's items", async () => {
      repo.findOrderDetail.mockResolvedValue({
        id: "order1",
        items: [{ id: "item1", merchantId: "someone-else" }],
      } as never);
      await expect(service.findForMerchant("order1", "m1")).rejects.toBeInstanceOf(NotFoundException);
    });

    it("returns only this merchant's items from a multi-vendor order", async () => {
      repo.findOrderDetail.mockResolvedValue({
        id: "order1",
        items: [
          { id: "item1", merchantId: "m1", totalPrice: 100 },
          { id: "item2", merchantId: "someone-else", totalPrice: 999 },
        ],
      } as never);
      const result = await service.findForMerchant("order1", "m1");
      expect(result.items).toEqual([{ id: "item1", merchantId: "m1", totalPrice: 100 }]);
    });
  });
});
