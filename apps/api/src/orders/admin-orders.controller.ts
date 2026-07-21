import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { AdminAuth } from "../auth/decorators/auth.decorators";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedPrincipal } from "../auth/types/jwt-payload.interface";
import { AdminOrderQueryDto } from "./dto/admin-order-query.dto";
import { CancelOrderDto } from "./dto/cancel-order.dto";
import { MarkCodReceivedDto } from "./dto/mark-cod-received.dto";
import { RejectOrderDto } from "./dto/reject-order.dto";
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

  @Post(":id/confirm")
  @AdminAuth("order.edit")
  @ApiOkResponse()
  confirm(@Param("id") id: string, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.adminConfirmOrder(id, user.id);
  }

  @Post(":id/reject")
  @AdminAuth("order.edit")
  @ApiOkResponse()
  reject(@Param("id") id: string, @Body() dto: RejectOrderDto, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.adminRejectOrder(id, user.id, dto.reason);
  }

  @Post(":id/mark-delivered")
  @AdminAuth("order.edit")
  @ApiOkResponse()
  markDelivered(@Param("id") id: string, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.adminMarkDelivered(id, user.id);
  }

  @Post(":id/mark-cod-received")
  @AdminAuth("order.edit")
  @ApiOkResponse()
  markCodReceived(
    @Param("id") id: string,
    @Body() dto: MarkCodReceivedDto,
    @CurrentUser() user: AuthenticatedPrincipal,
  ) {
    return this.service.markCodReceived(id, user.id, {
      amountReceived: dto.amountReceived,
      receivedDate: new Date(dto.receivedDate),
      remarks: dto.remarks,
    });
  }

  @Post(":id/mark-cod-refused")
  @AdminAuth("order.edit")
  @ApiOkResponse()
  markCodRefused(
    @Param("id") id: string,
    @Body() dto: RejectOrderDto,
    @CurrentUser() user: AuthenticatedPrincipal,
  ) {
    return this.service.markCodRefused(id, { type: "ADMIN", id: user.id }, dto.reason);
  }

  @Post(":id/cancel")
  @AdminAuth("order.edit")
  @ApiOkResponse()
  cancel(@Param("id") id: string, @Body() dto: CancelOrderDto, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.adminCancelOrder(id, user.id, dto.reason);
  }
}
