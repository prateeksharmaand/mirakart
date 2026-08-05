import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { MerchantAuth } from "../auth/decorators/auth.decorators";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedPrincipal } from "../auth/types/jwt-payload.interface";
import { CouponsService } from "./coupons.service";
import { CouponQueryDto } from "./dto/coupon-query.dto";
import { CreateCouponDto } from "./dto/create-coupon.dto";
import { UpdateCouponDto } from "./dto/update-coupon.dto";

@ApiTags("merchant-coupons")
@MerchantAuth()
@Controller("merchants/me/coupons")
export class MerchantCouponsController {
  constructor(private readonly service: CouponsService) {}

  @Get()
  @ApiOkResponse()
  list(@Query() query: CouponQueryDto, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.listForMerchant(user.id, query);
  }

  @Get(":id")
  @ApiOkResponse()
  findOne(@Param("id") id: string, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.findOwned(id, user.id);
  }

  @Post()
  @ApiCreatedResponse()
  create(@Body() dto: CreateCouponDto, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.create(user.id, dto);
  }

  @Patch(":id")
  @ApiOkResponse()
  update(@Param("id") id: string, @Body() dto: UpdateCouponDto, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.update(id, user.id, dto);
  }
}
