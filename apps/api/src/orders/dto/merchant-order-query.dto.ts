import { ApiPropertyOptional } from "@nestjs/swagger";
import type { OrderItemStatus } from "@prisma/client";
import { IsIn, IsOptional, IsString } from "class-validator";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { ORDER_ITEM_STATUSES } from "./order-status.constants";

export class MerchantOrderQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ORDER_ITEM_STATUSES, description: "Filters by this merchant's own item status" })
  @IsOptional()
  @IsIn(ORDER_ITEM_STATUSES)
  status?: OrderItemStatus;

  @ApiPropertyOptional({ description: "Free-text search by order number, tracking number, customer name, or product name" })
  @IsOptional()
  @IsString()
  search?: string;
}
