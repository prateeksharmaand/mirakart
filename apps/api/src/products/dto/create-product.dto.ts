import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsIn, IsNumber, IsOptional, IsString, Min, MinLength } from "class-validator";
import { Type } from "class-transformer";

const CREATABLE_STATUSES = ["DRAFT", "PENDING_APPROVAL"] as const;

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  categoryId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  name!: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  description!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  basePrice!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  compareAtPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiPropertyOptional({ enum: CREATABLE_STATUSES, default: "DRAFT" })
  @IsOptional()
  @IsIn(CREATABLE_STATUSES)
  status?: (typeof CREATABLE_STATUSES)[number];

  @ApiPropertyOptional({ type: [String], description: "Tag IDs to attach to this product" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];
}
