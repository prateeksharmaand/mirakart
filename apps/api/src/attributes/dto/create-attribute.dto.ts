import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { AttributeType } from "@prisma/client";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

const ATTRIBUTE_TYPES: AttributeType[] = ["SELECT", "COLOR", "TEXT"];

export class CreateAttributeValueDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  value!: string;

  @ApiPropertyOptional({ description: "Hex color, required when the attribute type is COLOR" })
  @IsOptional()
  @IsString()
  colorHex?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreateAttributeDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ enum: ATTRIBUTE_TYPES })
  @IsIn(ATTRIBUTE_TYPES)
  type!: AttributeType;

  @ApiProperty({ type: [CreateAttributeValueDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateAttributeValueDto)
  values!: CreateAttributeValueDto[];
}
