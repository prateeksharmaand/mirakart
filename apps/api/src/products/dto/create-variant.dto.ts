import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ArrayMinSize, IsArray, IsNumber, IsOptional, IsString, Min, MinLength } from "class-validator";
import { Type } from "class-transformer";

export class CreateVariantDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  sku!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  compareAtPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiProperty({ type: [String], description: "e.g. [sizeM.id, colorRed.id]" })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  attributeValueIds!: string[];
}
