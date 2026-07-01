import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { BannerPosition } from "@prisma/client";
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Min, MinLength } from "class-validator";

const BANNER_POSITIONS: BannerPosition[] = ["HOME_HERO", "HOME_SECONDARY", "CATEGORY_TOP", "STOREFRONT_TOP"];

export class CreateBannerDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiProperty({ description: "Media id returned by POST /uploads (purpose: BANNERS)" })
  @IsString()
  mediaId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkUrl?: string;

  @ApiProperty({ enum: BANNER_POSITIONS })
  @IsIn(BANNER_POSITIONS)
  position!: BannerPosition;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endAt?: string;
}
