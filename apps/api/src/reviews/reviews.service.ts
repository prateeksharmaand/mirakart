import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ReviewsRepository } from "./reviews.repository";
import type { CreateReviewDto } from "./dto/create-review.dto";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ReviewsService {
  constructor(
    private readonly repo: ReviewsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getProductReviews(productId: string, page = 1, limit = 10) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
      select: { id: true },
    });
    if (!product) throw new NotFoundException("Product not found");

    const [reviews, totalItems] = await this.repo.findByProduct(productId, page, limit);
    const summary = await this.repo.getProductSummary(productId);
    const totalPages = Math.ceil(totalItems / limit);
    return {
      data: reviews,
      meta: { page, limit, totalItems, totalPages },
      summary,
    };
  }

  async getProductSummary(productId: string) {
    return this.repo.getProductSummary(productId);
  }

  getMyReviews(customerId: string) {
    return this.repo.findByCustomer(customerId);
  }

  async create(customerId: string, productId: string, dto: CreateReviewDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null, status: "APPROVED" },
      select: { id: true },
    });
    if (!product) throw new NotFoundException("Product not found");

    const existing = await this.repo.findOne(productId, customerId);
    if (existing && !existing.deletedAt) {
      throw new ConflictException("You have already reviewed this product");
    }

    const verifiedPurchase = await this.repo.hasVerifiedPurchase(customerId, productId);
    const id = Math.random().toString(36).slice(2) + Date.now().toString(36);

    return this.repo.create({
      id,
      productId,
      customerId,
      rating: dto.rating,
      title: dto.title,
      body: dto.body,
      verifiedPurchase,
    });
  }

  async update(customerId: string, reviewId: string, dto: Partial<CreateReviewDto>) {
    const review = await this.repo.findById(reviewId);
    if (!review) throw new NotFoundException("Review not found");
    if (review.customerId !== customerId) throw new ForbiddenException("Not your review");
    return this.repo.update(reviewId, {
      rating: dto.rating,
      title: dto.title,
      body: dto.body,
    });
  }

  async remove(customerId: string, reviewId: string) {
    const review = await this.repo.findById(reviewId);
    if (!review) throw new NotFoundException("Review not found");
    if (review.customerId !== customerId) throw new ForbiddenException("Not your review");
    await this.repo.softDelete(reviewId);
  }

  async adminList(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [reviews, totalItems] = await Promise.all([
      this.prisma.review.findMany({
        where: { deletedAt: null },
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, email: true } },
          product: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where: { deletedAt: null } }),
    ]);
    return { data: reviews, meta: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) } };
  }

  async adminApprove(reviewId: string, isApproved: boolean) {
    const review = await this.repo.findById(reviewId);
    if (!review) throw new NotFoundException("Review not found");
    return this.repo.setApproved(reviewId, isApproved);
  }

  async adminDelete(reviewId: string) {
    const review = await this.repo.findById(reviewId);
    if (!review) throw new NotFoundException("Review not found");
    await this.repo.softDelete(reviewId);
  }
}
