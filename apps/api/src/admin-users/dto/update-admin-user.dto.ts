import { ApiPropertyOptional } from "@nestjs/swagger";
import type { AdminStatus } from "@prisma/client";
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

const ADMIN_STATUSES: AdminStatus[] = ["ACTIVE", "INACTIVE", "SUSPENDED"];

export class UpdateAdminUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: ADMIN_STATUSES })
  @IsOptional()
  @IsIn(ADMIN_STATUSES)
  status?: AdminStatus;

  @ApiPropertyOptional({ description: "Pass null to unassign the role." })
  @IsOptional()
  @IsString()
  roleId?: string | null;
}
