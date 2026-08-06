import { ApiPropertyOptional } from "@nestjs/swagger";
import type { DispatchMethod, OrderStatus, PaymentStatus } from "@prisma/client";
import { IsIn, IsOptional, IsString } from "class-validator";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "./order-status.constants";

const PAYMENT_METHOD_FILTERS = ["COD", "ONLINE"] as const;
export type PaymentMethodFilter = (typeof PAYMENT_METHOD_FILTERS)[number];

const DISPATCH_METHOD_FILTERS: DispatchMethod[] = ["COURIER", "SELF_DELIVERY"];

export class AdminOrderQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ORDER_STATUSES })
  @IsOptional()
  @IsIn(ORDER_STATUSES)
  status?: OrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  merchantId?: string;

  @ApiPropertyOptional({ enum: DISPATCH_METHOD_FILTERS })
  @IsOptional()
  @IsIn(DISPATCH_METHOD_FILTERS)
  dispatchMethod?: DispatchMethod;

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

  @ApiPropertyOptional({ description: "Free-text search by order number, customer name/email, or tracking number" })
  @IsOptional()
  @IsString()
  search?: string;
}
