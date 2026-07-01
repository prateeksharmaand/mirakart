import { Body, Controller, Get, Param, Patch, Query } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { AdminAuth } from "../auth/decorators/auth.decorators";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedPrincipal } from "../auth/types/jwt-payload.interface";
import { AdminOrderQueryDto } from "./dto/admin-order-query.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import { OrdersService } from "./orders.service";

@ApiTags("admin-orders")
@Controller("admin/orders")
export class AdminOrdersController {
  constructor(private readonly service: OrdersService) {}

  @Get()
  @AdminAuth("order.view")
  @ApiOkResponse()
  list(@Query() query: AdminOrderQueryDto) {
    return this.service.listForAdmin(query);
  }

  @Get(":id")
  @AdminAuth("order.view")
  @ApiOkResponse()
  findOne(@Param("id") id: string) {
    return this.service.findForAdmin(id);
  }

  @Patch(":id/status")
  @AdminAuth("order.edit")
  @ApiOkResponse()
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: AuthenticatedPrincipal,
  ) {
    return this.service.updateOrderStatus(id, user.id, dto.status, dto.note);
  }
}
