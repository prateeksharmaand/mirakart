import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { AdminAuth, CustomerAuth, MerchantAuth } from "../auth/decorators/auth.decorators";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedPrincipal } from "../auth/types/jwt-payload.interface";
import { CustomerQueriesRepository } from "./customer-queries.repository";
import { AnswerQueryDto, CreateQueryDto } from "./dto/create-query.dto";
import { PrismaService } from "../prisma/prisma.service";

@ApiTags("customer-queries")
@Controller()
export class CustomerQueriesController {
  constructor(
    private readonly repo: CustomerQueriesRepository,
    private readonly prisma: PrismaService,
  ) {}

  // ── Public: answered queries on a product ────────────────────────────────────
  @Get("products/:productId/queries")
  @ApiOkResponse()
  getProductQueries(@Param("productId") productId: string) {
    return this.repo.findByProduct(productId, true);
  }

  // ── Customer: ask a question ──────────────────────────────────────────────────
  @Post("products/:productId/queries")
  @CustomerAuth()
  @ApiOkResponse()
  async create(
    @Param("productId") productId: string,
    @Body() dto: CreateQueryDto,
    @CurrentUser() user: AuthenticatedPrincipal,
  ) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null, status: "APPROVED" },
      select: { id: true },
    });
    if (!product) throw new NotFoundException("Product not found");
    const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return this.repo.create({ id, productId, customerId: user.id, question: dto.question });
  }

  // ── Merchant: list + answer queries on their products ────────────────────────
  @Get("merchants/me/queries")
  @MerchantAuth()
  @ApiOkResponse()
  merchantList(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.repo.findByMerchant(user.id, Number(page ?? 1), Number(limit ?? 20)).then(
      ([data, totalItems]) => ({
        data,
        meta: {
          page: Number(page ?? 1),
          limit: Number(limit ?? 20),
          totalItems,
          totalPages: Math.ceil(totalItems / Number(limit ?? 20)),
        },
      }),
    );
  }

  @Post("merchants/me/queries/:id/answer")
  @MerchantAuth()
  @ApiOkResponse()
  async answer(
    @Param("id") id: string,
    @Body() dto: AnswerQueryDto,
    @CurrentUser() user: AuthenticatedPrincipal,
  ) {
    const query = await this.repo.findById(id);
    if (!query) throw new NotFoundException("Query not found");
    // Verify product belongs to this merchant
    const product = await this.prisma.product.findFirst({
      where: { id: query.productId, merchantId: user.id },
      select: { id: true },
    });
    if (!product) throw new NotFoundException("Query not found");
    return this.repo.answer(id, dto.answer, user.id);
  }

  // ── Admin ─────────────────────────────────────────────────────────────────────
  @Get("admin/queries")
  @AdminAuth("query.view")
  @ApiOkResponse()
  adminList(@Query("page") page?: string, @Query("limit") limit?: string) {
    return this.repo.findByProduct("", false);
  }

  @Delete("admin/queries/:id")
  @AdminAuth("query.delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  async adminDelete(@Param("id") id: string) {
    const query = await this.repo.findById(id);
    if (!query) throw new NotFoundException("Query not found");
    await this.repo.softDelete(id);
  }
}
