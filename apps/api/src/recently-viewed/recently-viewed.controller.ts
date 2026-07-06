import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { CustomerAuth } from "../auth/decorators/auth.decorators";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedPrincipal } from "../auth/types/jwt-payload.interface";
import { RecentlyViewedRepository } from "./recently-viewed.repository";

@ApiTags("recently-viewed")
@CustomerAuth()
@Controller("recently-viewed")
export class RecentlyViewedController {
  constructor(private readonly repo: RecentlyViewedRepository) {}

  @Get()
  @ApiOkResponse()
  getRecentlyViewed(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Query("limit") limit?: string,
  ) {
    return this.repo.findByCustomer(user.id, Number(limit ?? 20));
  }

  @Post(":productId")
  @HttpCode(HttpStatus.NO_CONTENT)
  track(@Param("productId") productId: string, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.repo.track(user.id, productId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  clear(@CurrentUser() user: AuthenticatedPrincipal) {
    return this.repo.clear(user.id);
  }
}
