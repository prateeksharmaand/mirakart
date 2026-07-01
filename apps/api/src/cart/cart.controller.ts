import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { CustomerAuth } from "../auth/decorators/auth.decorators";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedPrincipal } from "../auth/types/jwt-payload.interface";
import { CartService } from "./cart.service";
import { AddCartItemDto } from "./dto/add-cart-item.dto";
import { UpdateCartItemDto } from "./dto/update-cart-item.dto";

@ApiTags("cart")
@CustomerAuth()
@Controller("cart")
export class CartController {
  constructor(private readonly service: CartService) {}

  @Get()
  @ApiOkResponse()
  getCart(@CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.getCart(user.id);
  }

  @Post("items")
  @ApiCreatedResponse()
  addItem(@Body() dto: AddCartItemDto, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.addItem(user.id, dto);
  }

  @Patch("items/:itemId")
  @ApiOkResponse()
  updateItem(
    @Param("itemId") itemId: string,
    @Body() dto: UpdateCartItemDto,
    @CurrentUser() user: AuthenticatedPrincipal,
  ) {
    return this.service.updateItem(user.id, itemId, dto);
  }

  @Delete("items/:itemId")
  @ApiOkResponse()
  removeItem(@Param("itemId") itemId: string, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.removeItem(user.id, itemId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  clear(@CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.clear(user.id);
  }
}
