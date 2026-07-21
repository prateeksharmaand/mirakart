import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { MerchantAuth } from "../auth/decorators/auth.decorators";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedPrincipal } from "../auth/types/jwt-payload.interface";
import { CancelOrderDto } from "./dto/cancel-order.dto";
import { MerchantOrderQueryDto } from "./dto/merchant-order-query.dto";
import { RejectOrderDto } from "./dto/reject-order.dto";
import { UpdateFulfillmentStatusDto } from "./dto/update-fulfillment-status.dto";
import { OrdersService } from "./orders.service";

@ApiTags("merchant-orders")
@MerchantAuth()
@Controller("merchants/me/orders")
export class MerchantOrdersController {
  constructor(private readonly service: OrdersService) {}

  @Get()
  @ApiOkResponse()
  list(@Query() query: MerchantOrderQueryDto, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.listForMerchant(user.id, query.page, query.limit, query.status);
  }

  @Get(":id")
  @ApiOkResponse()
  findOne(@Param("id") id: string, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.findForMerchant(id, user.id);
  }

  @Post(":id/accept")
  @ApiOkResponse()
  accept(@Param("id") id: string, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.merchantAcceptOrder(id, user.id);
  }

  @Post(":id/reject")
  @ApiOkResponse()
  reject(@Param("id") id: string, @Body() dto: RejectOrderDto, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.merchantRejectOrder(id, user.id, dto.reason);
  }

  @Patch(":id/fulfillment-status")
  @ApiOkResponse()
  updateFulfillmentStatus(
    @Param("id") id: string,
    @Body() dto: UpdateFulfillmentStatusDto,
    @CurrentUser() user: AuthenticatedPrincipal,
  ) {
    return this.service.merchantUpdateFulfillment(id, user.id, dto.status);
  }

  @Post(":id/mark-cod-refused")
  @ApiOkResponse()
  markCodRefused(
    @Param("id") id: string,
    @Body() dto: RejectOrderDto,
    @CurrentUser() user: AuthenticatedPrincipal,
  ) {
    return this.service.markCodRefused(id, { type: "MERCHANT", id: user.id }, dto.reason);
  }

  @Post(":id/cancel")
  @ApiOkResponse()
  cancel(@Param("id") id: string, @Body() dto: CancelOrderDto, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.merchantCancelOrder(id, user.id, dto.reason);
  }
}
