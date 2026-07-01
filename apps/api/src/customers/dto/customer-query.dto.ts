import { ApiPropertyOptional } from "@nestjs/swagger";
import type { CustomerStatus } from "@prisma/client";
import { IsIn, IsOptional, IsString } from "class-validator";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";

const CUSTOMER_STATUSES: CustomerStatus[] = ["ACTIVE", "INACTIVE", "BLOCKED"];

export class CustomerQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: CUSTOMER_STATUSES })
  @IsOptional()
  @IsIn(CUSTOMER_STATUSES)
  status?: CustomerStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
