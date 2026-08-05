import { ApiPropertyOptional } from "@nestjs/swagger";
import type { ReturnStatus } from "@prisma/client";
import { IsIn, IsOptional } from "class-validator";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";

const RETURN_STATUSES: ReturnStatus[] = [
  "REQUESTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "AWAITING_SHIPMENT",
  "ITEM_RECEIVED",
  "COMPLETED",
  "CANCELLED",
];

export class MerchantReturnQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: RETURN_STATUSES })
  @IsOptional()
  @IsIn(RETURN_STATUSES)
  status?: ReturnStatus;
}
