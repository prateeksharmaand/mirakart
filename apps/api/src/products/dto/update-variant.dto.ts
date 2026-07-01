import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, Min, MinLength } from "class-validator";
import { Type } from "class-transformer";

export class UpdateVariantDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  sku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  compareAtPrice?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  weight?: number | null;
}
