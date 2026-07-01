import { ApiPropertyOptional } from "@nestjs/swagger";
import type { AdminStatus } from "@prisma/client";
import { IsIn, IsOptional, IsString } from "class-validator";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";

const ADMIN_STATUSES: AdminStatus[] = ["ACTIVE", "INACTIVE", "SUSPENDED"];

export class AdminUserQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ADMIN_STATUSES })
  @IsOptional()
  @IsIn(ADMIN_STATUSES)
  status?: AdminStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
