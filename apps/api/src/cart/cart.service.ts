import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { CartRepository } from "./cart.repository";
import type { AddCartItemDto } from "./dto/add-cart-item.dto";
import type { UpdateCartItemDto } from "./dto/update-cart-item.dto";

@Injectable()
export class CartService {
  constructor(private readonly repo: CartRepository) {}

  async getCart(customerId: string) {
    await this.repo.findOrCreateCart(customerId);
    const cart = await this.repo.findCartWithItems(customerId);
    if (!cart) throw new NotFoundException("Cart not found");

    let subtotal = 0;
    const items = cart.items.map((item) => {
      const variant = item.variant;
      const product = variant.product;
      const inStock = (variant.inventory?.quantity ?? 0) >= item.quantity;
      const isAvailable = product.status === "APPROVED" && !product.deletedAt && inStock;
      const currentPrice = Number(variant.price);
      const priceChanged = currentPrice !== Number(item.priceSnapshot);
      if (isAvailable) subtotal += currentPrice * item.quantity;

      return {
        id: item.id,
        variantId: item.variantId,
        quantity: item.quantity,
        priceSnapshot: Number(item.priceSnapshot),
        currentPrice,
        priceChanged,
        isAvailable,
        availableStock: variant.inventory?.quantity ?? 0,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          image: product.images[0]?.media.url,
        },
        variant: {
          sku: variant.sku,
          attributeValues: variant.attributeValues.map((av) => ({
            attributeName: av.attributeValue.attribute.name,
            value: av.attributeValue.value,
            colorHex: av.attributeValue.colorHex,
          })),
        },
      };
    });

    return { id: cart.id, items, subtotal };
  }

  async addItem(customerId: string, dto: AddCartItemDto) {
    const variant = await this.repo.findPurchasableVariant(dto.variantId);
    if (!variant) throw new NotFoundException("Product variant not found");
    if (variant.product.status !== "APPROVED" || variant.product.deletedAt) {
      throw new BadRequestException("This product is not available for purchase");
    }

    const cart = await this.repo.findOrCreateCart(customerId);
    const existingItem = await this.repo.findItemByVariant(cart.id, dto.variantId);
    const newQuantity = (existingItem?.quantity ?? 0) + dto.quantity;
    const availableStock = variant.inventory?.quantity ?? 0;
    if (newQuantity > availableStock) {
      throw new BadRequestException(`Only ${availableStock} unit(s) in stock`);
    }

    if (existingItem) {
      await this.repo.updateItemQuantity(existingItem.id, newQuantity);
    } else {
      await this.repo.createItem(cart.id, dto.variantId, dto.quantity, Number(variant.price));
    }
    return this.getCart(customerId);
  }

  async updateItem(customerId: string, itemId: string, dto: UpdateCartItemDto) {
    const item = await this.assertOwnedItem(itemId, customerId);
    const variant = await this.repo.findPurchasableVariant(item.variantId);
    const availableStock = variant?.inventory?.quantity ?? 0;
    if (dto.quantity > availableStock) {
      throw new BadRequestException(`Only ${availableStock} unit(s) in stock`);
    }
    await this.repo.updateItemQuantity(itemId, dto.quantity);
    return this.getCart(customerId);
  }

  async removeItem(customerId: string, itemId: string) {
    await this.assertOwnedItem(itemId, customerId);
    await this.repo.deleteItem(itemId);
    return this.getCart(customerId);
  }

  async clear(customerId: string): Promise<void> {
    const cart = await this.repo.findOrCreateCart(customerId);
    await this.repo.clearItems(cart.id);
  }

  private async assertOwnedItem(itemId: string, customerId: string) {
    const item = await this.repo.findItemById(itemId);
    if (!item || item.cart.customerId !== customerId) {
      throw new NotFoundException("Cart item not found");
    }
    return item;
  }
}
