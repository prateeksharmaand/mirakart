import { ApiPropertyOptional } from "@nestjs/swagger";
import type { MerchantStatus } from "@prisma/client";
import { IsIn, IsOptional, IsString } from "class-validator";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";

const MERCHANT_STATUSES: MerchantStatus[] = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"];

export class MerchantQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: MERCHANT_STATUSES })
  @IsOptional()
  @IsIn(MERCHANT_STATUSES)
  status?: MerchantStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
