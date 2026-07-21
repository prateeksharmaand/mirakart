import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { CustomerAuth } from "../auth/decorators/auth.decorators";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedPrincipal } from "../auth/types/jwt-payload.interface";
import { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import { CancelOrderDto } from "./dto/cancel-order.dto";
import { CheckoutDto } from "./dto/checkout.dto";
import { OrdersService } from "./orders.service";

@ApiTags("orders")
@CustomerAuth()
@Controller("orders")
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Post("checkout")
  @ApiCreatedResponse()
  checkout(@Body() dto: CheckoutDto, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.checkout(user.id, dto);
  }

  @Get()
  @ApiOkResponse()
  list(@Query() query: PaginationQueryDto, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.listForCustomer(user.id, query.page, query.limit);
  }

  @Get(":id")
  @ApiOkResponse()
  findOne(@Param("id") id: string, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.findForCustomer(id, user.id);
  }

  @Get(":id/tracking")
  @ApiOkResponse()
  tracking(@Param("id") id: string, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.getTracking(id, user.id);
  }

  @Post(":id/cancel")
  @ApiOkResponse()
  cancel(@Param("id") id: string, @Body() dto: CancelOrderDto, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.customerCancelOrder(id, user.id, dto.reason);
  }
}
