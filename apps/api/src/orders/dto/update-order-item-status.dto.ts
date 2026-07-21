import { ApiProperty } from "@nestjs/swagger";
import type { OrderItemStatus } from "@prisma/client";
import { IsIn } from "class-validator";
import { ORDER_ITEM_STATUSES } from "./order-status.constants";

export class UpdateOrderItemStatusDto {
  @ApiProperty({ enum: ORDER_ITEM_STATUSES })
  @IsIn(ORDER_ITEM_STATUSES)
  status!: OrderItemStatus;
}
