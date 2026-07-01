import { ApiPropertyOptional } from "@nestjs/swagger";
import type { BannerPosition } from "@prisma/client";
import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, Min, MinLength } from "class-validator";

const BANNER_POSITIONS: BannerPosition[] = ["HOME_HERO", "HOME_SECONDARY", "CATEGORY_TOP", "STOREFRONT_TOP"];

export class UpdateBannerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mediaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkUrl?: string | null;

  @ApiPropertyOptional({ enum: BANNER_POSITIONS })
  @IsOptional()
  @IsIn(BANNER_POSITIONS)
  position?: BannerPosition;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startAt?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endAt?: string | null;
}
