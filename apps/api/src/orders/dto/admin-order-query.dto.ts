import { ApiPropertyOptional } from "@nestjs/swagger";
import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { IsIn, IsOptional, IsString } from "class-validator";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "./order-status.constants";

const PAYMENT_METHOD_FILTERS = ["COD", "ONLINE"] as const;
export type PaymentMethodFilter = (typeof PAYMENT_METHOD_FILTERS)[number];

export class AdminOrderQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ORDER_STATUSES })
  @IsOptional()
  @IsIn(ORDER_STATUSES)
  status?: OrderStatus;

  @ApiPropertyOptional({ enum: PAYMENT_STATUSES })
  @IsOptional()
  @IsIn(PAYMENT_STATUSES)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ enum: PAYMENT_METHOD_FILTERS })
  @IsOptional()
  @IsIn(PAYMENT_METHOD_FILTERS)
  paymentMethod?: PaymentMethodFilter;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerId?: string;
}
