import { BadRequestException, NotFoundException } from "@nestjs/common";
import { CartRepository } from "./cart.repository";
import { CartService } from "./cart.service";

describe("CartService", () => {
  let service: CartService;
  let repo: jest.Mocked<CartRepository>;

  beforeEach(() => {
    repo = {
      findOrCreateCart: jest.fn(),
      findCartWithItems: jest.fn(),
      findItemById: jest.fn(),
      findItemByVariant: jest.fn(),
      findPurchasableVariant: jest.fn(),
      createItem: jest.fn(),
      updateItemQuantity: jest.fn(),
      deleteItem: jest.fn(),
      clearItems: jest.fn(),
    } as unknown as jest.Mocked<CartRepository>;
    service = new CartService(repo);

    repo.findOrCreateCart.mockResolvedValue({ id: "cart1", customerId: "c1" } as never);
    repo.findCartWithItems.mockResolvedValue({ id: "cart1", items: [] } as never);
  });

  describe("addItem", () => {
    it("throws NotFoundException for an unknown variant", async () => {
      repo.findPurchasableVariant.mockResolvedValue(null);
      await expect(service.addItem("c1", { variantId: "v1", quantity: 1 })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("refuses to add a variant of a non-approved product", async () => {
      repo.findPurchasableVariant.mockResolvedValue({
        id: "v1",
        price: 100,
        product: { status: "PENDING_APPROVAL", deletedAt: null },
        inventory: { quantity: 10 },
      } as never);
      await expect(service.addItem("c1", { variantId: "v1", quantity: 1 })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it("refuses to add more than available stock", async () => {
      repo.findPurchasableVariant.mockResolvedValue({
        id: "v1",
        price: 100,
        product: { status: "APPROVED", deletedAt: null },
        inventory: { quantity: 2 },
      } as never);
      repo.findItemByVariant.mockResolvedValue(null);
      await expect(service.addItem("c1", { variantId: "v1", quantity: 5 })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it("increments quantity when the variant is already in the cart", async () => {
      repo.findPurchasableVariant.mockResolvedValue({
        id: "v1",
        price: 100,
        product: { status: "APPROVED", deletedAt: null },
        inventory: { quantity: 10 },
      } as never);
      repo.findItemByVariant.mockResolvedValue({ id: "item1", quantity: 2 } as never);

      await service.addItem("c1", { variantId: "v1", quantity: 3 });

      expect(repo.updateItemQuantity).toHaveBeenCalledWith("item1", 5);
      expect(repo.createItem).not.toHaveBeenCalled();
    });

    it("creates a new item using the variant's current price as the snapshot", async () => {
      repo.findPurchasableVariant.mockResolvedValue({
        id: "v1",
        price: 250,
        product: { status: "APPROVED", deletedAt: null },
        inventory: { quantity: 10 },
      } as never);
      repo.findItemByVariant.mockResolvedValue(null);

      await service.addItem("c1", { variantId: "v1", quantity: 1 });

      expect(repo.createItem).toHaveBeenCalledWith("cart1", "v1", 1, 250);
    });
  });

  describe("updateItem / removeItem ownership", () => {
    it("hides another customer's cart item behind NotFoundException", async () => {
      repo.findItemById.mockResolvedValue({ id: "item1", cart: { customerId: "someone-else" } } as never);
      await expect(service.updateItem("c1", "item1", { quantity: 2 })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      await expect(service.removeItem("c1", "item1")).rejects.toBeInstanceOf(NotFoundException);
    });

    it("blocks updating to a quantity beyond stock", async () => {
      repo.findItemById.mockResolvedValue({ id: "item1", variantId: "v1", cart: { customerId: "c1" } } as never);
      repo.findPurchasableVariant.mockResolvedValue({ inventory: { quantity: 3 } } as never);
      await expect(service.updateItem("c1", "item1", { quantity: 10 })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe("getCart", () => {
    it("marks an item unavailable when stock can't cover the requested quantity", async () => {
      repo.findCartWithItems.mockResolvedValue({
        id: "cart1",
        items: [
          {
            id: "item1",
            variantId: "v1",
            quantity: 5,
            priceSnapshot: 100,
            variant: {
              sku: "SKU1",
              price: 100,
              inventory: { quantity: 2 },
              attributeValues: [],
              product: { id: "p1", name: "Shoe", slug: "shoe", status: "APPROVED", deletedAt: null, images: [] },
            },
          },
        ],
      } as never);

      const cart = await service.getCart("c1");

      expect(cart.items[0]!.isAvailable).toBe(false);
      expect(cart.subtotal).toBe(0);
    });
  });
});
