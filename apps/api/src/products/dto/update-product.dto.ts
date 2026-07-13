import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsDateString, IsIn, IsNumber, IsOptional, IsString, Min, MinLength } from "class-validator";
import { Type } from "class-transformer";

const MERCHANT_SETTABLE_STATUSES = ["DRAFT", "PENDING_APPROVAL", "ARCHIVED"] as const;

export class UpdateProductDto {
  @ApiPropertyOptional({ enum: MERCHANT_SETTABLE_STATUSES })
  @IsOptional()
  @IsIn(MERCHANT_SETTABLE_STATUSES)
  status?: "DRAFT" | "PENDING_APPROVAL" | "ARCHIVED";
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: "Pass null to clear the brand." })
  @IsOptional()
  @IsString()
  brandId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  compareAtPrice?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  weight?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiPropertyOptional({ type: [String], description: "Tag IDs to sync (replaces existing tags)" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];

  @ApiPropertyOptional({ description: "ISO date the deal ends at. Pass null to clear." })
  @IsOptional()
  @IsDateString()
  dealEndsAt?: string | null;
}
