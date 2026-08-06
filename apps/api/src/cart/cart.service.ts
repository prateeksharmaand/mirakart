import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { CouponsService, type CartLineForPricing } from "../coupons/coupons.service";
import { CartRepository } from "./cart.repository";
import type { AddCartItemDto } from "./dto/add-cart-item.dto";
import type { UpdateCartItemDto } from "./dto/update-cart-item.dto";

type CartWithItems = NonNullable<Awaited<ReturnType<CartRepository["findCartWithItems"]>>>;

function isLineAvailable(item: CartWithItems["items"][number]): boolean {
  const inStock = (item.variant.inventory?.quantity ?? 0) >= item.quantity;
  return item.variant.product.status === "APPROVED" && !item.variant.product.deletedAt && inStock;
}

function toPricingLines(cart: CartWithItems): CartLineForPricing[] {
  return cart.items.filter(isLineAvailable).map((item) => ({
    merchantId: item.variant.product.merchantId,
    unitPrice: Number(item.variant.price),
    quantity: item.quantity,
  }));
}

@Injectable()
export class CartService {
  constructor(
    private readonly repo: CartRepository,
    private readonly coupons: CouponsService,
  ) {}

  async getCart(customerId: string) {
    await this.repo.findOrCreateCart(customerId);
    const cart = await this.repo.findCartWithItems(customerId);
    if (!cart) throw new NotFoundException("Cart not found");

    let subtotal = 0;
    const items = cart.items.map((item) => {
      const variant = item.variant;
      const product = variant.product;
      const isAvailable = isLineAvailable(item);
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
          image: product.images[0]?.media?.url,
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

    // A previously-applied coupon is re-validated on every read (never
    // trusted as-is) — prices, stock, and cart contents can all change
    // between when it was applied and now. If it no longer qualifies, it's
    // silently detached and the reason is surfaced so the frontend can toast it.
    let appliedCoupon: { code: string; discountAmount: number; merchantId: string } | null = null;
    let couponRemovedReason: string | null = null;
    if (cart.appliedCoupon) {
      try {
        const priced = await this.coupons.priceCartForCoupon(toPricingLines(cart), cart.appliedCoupon.code, customerId);
        appliedCoupon = { code: cart.appliedCoupon.code, discountAmount: priced.discountAmount, merchantId: priced.qualifyingMerchantId };
      } catch (e) {
        couponRemovedReason = e instanceof Error ? e.message : "This coupon could no longer be applied";
        await this.repo.setAppliedCoupon(cart.id, null);
      }
    }

    const discount = appliedCoupon?.discountAmount ?? 0;
    return { id: cart.id, items, subtotal, discount, total: subtotal - discount, appliedCoupon, couponRemovedReason };
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

  async applyCoupon(customerId: string, code: string) {
    const cart = await this.repo.findOrCreateCart(customerId);
    const cartWithItems = await this.repo.findCartWithItems(customerId);
    if (!cartWithItems) throw new NotFoundException("Cart not found");

    const priced = await this.coupons.priceCartForCoupon(toPricingLines(cartWithItems), code, customerId);
    await this.repo.setAppliedCoupon(cart.id, priced.coupon.id);
    return this.getCart(customerId);
  }

  async removeCoupon(customerId: string) {
    const cart = await this.repo.findOrCreateCart(customerId);
    await this.repo.setAppliedCoupon(cart.id, null);
    return this.getCart(customerId);
  }

  private async assertOwnedItem(itemId: string, customerId: string) {
    const item = await this.repo.findItemById(itemId);
    if (!item || item.cart.customerId !== customerId) {
      throw new NotFoundException("Cart item not found");
    }
    return item;
  }
}
