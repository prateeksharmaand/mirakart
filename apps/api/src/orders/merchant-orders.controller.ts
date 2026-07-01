import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { MerchantAuth } from "../auth/decorators/auth.decorators";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedPrincipal } from "../auth/types/jwt-payload.interface";
import { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import { OrdersService } from "./orders.service";

@ApiTags("merchant-orders")
@MerchantAuth()
@Controller("merchants/me/orders")
export class MerchantOrdersController {
  constructor(private readonly service: OrdersService) {}

  @Get()
  @ApiOkResponse()
  list(@Query() query: PaginationQueryDto, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.listForMerchant(user.id, query.page, query.limit);
  }

  @Get(":id")
  @ApiOkResponse()
  findOne(@Param("id") id: string, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.findForMerchant(id, user.id);
  }
}
