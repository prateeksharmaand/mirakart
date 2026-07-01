import { Body, Controller, Param, Patch, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { PrincipalAuthGuard } from "../auth/guards/principal-auth.guard";
import { RequirePrincipal } from "../auth/decorators/principal-type.decorator";
import type { AuthenticatedPrincipal } from "../auth/types/jwt-payload.interface";
import { UpdateOrderItemStatusDto } from "./dto/update-order-item-status.dto";
import { OrdersService } from "./orders.service";

@ApiTags("orders")
@Controller("orders")
export class OrderItemsController {
  constructor(private readonly service: OrdersService) {}

  @Patch(":orderId/items/:itemId/status")
  @RequirePrincipal("MERCHANT", "ADMIN")
  @UseGuards(PrincipalAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse()
  updateStatus(
    @Param("orderId") orderId: string,
    @Param("itemId") itemId: string,
    @Body() dto: UpdateOrderItemStatusDto,
    @CurrentUser() user: AuthenticatedPrincipal,
  ) {
    return this.service.updateItemStatus(orderId, itemId, dto.status, {
      type: user.type as "MERCHANT" | "ADMIN",
      id: user.id,
    });
  }
}
