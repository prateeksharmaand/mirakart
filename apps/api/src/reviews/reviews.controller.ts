import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { AdminAuth, CustomerAuth } from "../auth/decorators/auth.decorators";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedPrincipal } from "../auth/types/jwt-payload.interface";
import { ReviewsService } from "./reviews.service";
import { CreateReviewDto } from "./dto/create-review.dto";

@ApiTags("reviews")
@Controller()
export class ReviewsController {
  constructor(private readonly service: ReviewsService) {}

  // ── Public ──────────────────────────────────────────────────────────────────
  @Get("products/:productId/reviews")
  @ApiOkResponse()
  getProductReviews(
    @Param("productId") productId: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.service.getProductReviews(productId, Number(page ?? 1), Number(limit ?? 10));
  }

  @Get("products/:productId/reviews/summary")
  @ApiOkResponse()
  getProductSummary(@Param("productId") productId: string) {
    return this.service.getProductSummary(productId);
  }

  // ── Customer ─────────────────────────────────────────────────────────────────
  @Get("account/reviews")
  @CustomerAuth()
  @ApiOkResponse()
  getMyReviews(@CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.getMyReviews(user.id);
  }

  @Post("products/:productId/reviews")
  @CustomerAuth()
  @ApiOkResponse()
  create(
    @Param("productId") productId: string,
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: AuthenticatedPrincipal,
  ) {
    return this.service.create(user.id, productId, dto);
  }

  @Patch("reviews/:id")
  @CustomerAuth()
  @ApiOkResponse()
  update(
    @Param("id") id: string,
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: AuthenticatedPrincipal,
  ) {
    return this.service.update(user.id, id, dto);
  }

  @Delete("reviews/:id")
  @CustomerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.remove(user.id, id);
  }

  // ── Admin ────────────────────────────────────────────────────────────────────
  @Get("admin/reviews")
  @AdminAuth("review.view")
  @ApiOkResponse()
  adminList(@Query("page") page?: string, @Query("limit") limit?: string) {
    return this.service.adminList(Number(page ?? 1), Number(limit ?? 20));
  }

  @Patch("admin/reviews/:id/approve")
  @AdminAuth("review.edit")
  @ApiOkResponse()
  adminApprove(@Param("id") id: string) {
    return this.service.adminApprove(id, true);
  }

  @Patch("admin/reviews/:id/reject")
  @AdminAuth("review.edit")
  @ApiOkResponse()
  adminReject(@Param("id") id: string) {
    return this.service.adminApprove(id, false);
  }

  @Delete("admin/reviews/:id")
  @AdminAuth("review.delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  adminDelete(@Param("id") id: string) {
    return this.service.adminDelete(id);
  }
}
