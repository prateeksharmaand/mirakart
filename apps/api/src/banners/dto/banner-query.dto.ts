import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import type { BannerPosition } from "@prisma/client";
import { IsBoolean, IsIn, IsOptional, IsString } from "class-validator";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";

const BANNER_POSITIONS = ["HOME_HERO", "HOME_SECONDARY", "STOREFRONT_TOP", "CATEGORY_TOP"] as const;

export class BannerQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: BANNER_POSITIONS })
  @IsOptional()
  @IsIn(BANNER_POSITIONS)
  position?: BannerPosition;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === "true")
  @IsBoolean()
  isActive?: boolean;
}
