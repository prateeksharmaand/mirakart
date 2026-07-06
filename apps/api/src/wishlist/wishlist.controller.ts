import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { CustomerAuth } from "../auth/decorators/auth.decorators";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedPrincipal } from "../auth/types/jwt-payload.interface";
import { WishlistService } from "./wishlist.service";

@ApiTags("wishlist")
@CustomerAuth()
@Controller("wishlist")
export class WishlistController {
  constructor(private readonly service: WishlistService) {}

  @Get()
  @ApiOkResponse()
  getWishlist(@CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.getWishlist(user.id);
  }

  @Get("product-ids")
  @ApiOkResponse()
  getProductIds(@CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.getProductIds(user.id);
  }

  @Post(":productId/toggle")
  @ApiOkResponse()
  toggle(
    @Param("productId") productId: string,
    @CurrentUser() user: AuthenticatedPrincipal,
  ) {
    return this.service.toggle(user.id, productId);
  }

  @Post(":productId")
  @ApiOkResponse()
  add(
    @Param("productId") productId: string,
    @CurrentUser() user: AuthenticatedPrincipal,
  ) {
    return this.service.add(user.id, productId);
  }

  @Delete(":productId")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param("productId") productId: string,
    @CurrentUser() user: AuthenticatedPrincipal,
  ) {
    return this.service.remove(user.id, productId);
  }
}
