import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { AdminAuth } from "../auth/decorators/auth.decorators";
import { AdminOrderQueryDto } from "./dto/admin-order-query.dto";
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
}
