import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { WishlistRepository } from "./wishlist.repository";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class WishlistService {
  constructor(
    private readonly repo: WishlistRepository,
    private readonly prisma: PrismaService,
  ) {}

  getWishlist(customerId: string) {
    return this.repo.findByCustomer(customerId);
  }

  getProductIds(customerId: string) {
    return this.repo.getProductIds(customerId);
  }

  async toggle(customerId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null, status: "APPROVED" },
      select: { id: true },
    });
    if (!product) throw new NotFoundException("Product not found");

    const existing = await this.repo.findItem(customerId, productId);
    if (existing) {
      await this.repo.remove(customerId, productId);
      return { wishlisted: false };
    }
    await this.repo.add(customerId, productId);
    return { wishlisted: true };
  }

  async add(customerId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null, status: "APPROVED" },
      select: { id: true },
    });
    if (!product) throw new NotFoundException("Product not found");

    const existing = await this.repo.findItem(customerId, productId);
    if (existing) throw new ConflictException("Product already in wishlist");
    return this.repo.add(customerId, productId);
  }

  async remove(customerId: string, productId: string) {
    const existing = await this.repo.findItem(customerId, productId);
    if (!existing) throw new NotFoundException("Product not in wishlist");
    await this.repo.remove(customerId, productId);
  }

  isWishlisted(customerId: string, productId: string): Promise<boolean> {
    return this.repo.findItem(customerId, productId).then((item) => !!item);
  }
}
