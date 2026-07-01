import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const cartItemsInclude = {
  items: {
    include: {
      variant: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              status: true,
              deletedAt: true,
              images: { where: { isPrimary: true }, take: 1, include: { media: true } },
            },
          },
          inventory: true,
          attributeValues: { include: { attributeValue: { include: { attribute: true } } } },
        },
      },
    },
  },
};

@Injectable()
export class CartRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreateCart(customerId: string) {
    const existing = await this.prisma.cart.findUnique({ where: { customerId } });
    if (existing) return existing;
    return this.prisma.cart.create({ data: { customerId } });
  }

  findCartWithItems(customerId: string) {
    return this.prisma.cart.findUnique({ where: { customerId }, include: cartItemsInclude });
  }

  findItemById(id: string) {
    return this.prisma.cartItem.findUnique({ where: { id }, include: { cart: true } });
  }

  findItemByVariant(cartId: string, variantId: string) {
    return this.prisma.cartItem.findUnique({ where: { cartId_variantId: { cartId, variantId } } });
  }

  findPurchasableVariant(variantId: string) {
    return this.prisma.productVariant.findFirst({
      where: { id: variantId, deletedAt: null },
      include: { product: true, inventory: true },
    });
  }

  createItem(cartId: string, variantId: string, quantity: number, priceSnapshot: number) {
    return this.prisma.cartItem.create({ data: { cartId, variantId, quantity, priceSnapshot } });
  }

  updateItemQuantity(id: string, quantity: number) {
    return this.prisma.cartItem.update({ where: { id }, data: { quantity } });
  }

  deleteItem(id: string) {
    return this.prisma.cartItem.delete({ where: { id } });
  }

  clearItems(cartId: string) {
    return this.prisma.cartItem.deleteMany({ where: { cartId } });
  }
}
