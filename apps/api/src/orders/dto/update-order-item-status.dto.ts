import { ApiProperty } from "@nestjs/swagger";
import type { OrderItemStatus } from "@prisma/client";
import { IsIn } from "class-validator";

const ORDER_ITEM_STATUSES: OrderItemStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
];

export class UpdateOrderItemStatusDto {
  @ApiProperty({ enum: ORDER_ITEM_STATUSES })
  @IsIn(ORDER_ITEM_STATUSES)
  status!: OrderItemStatus;
}
