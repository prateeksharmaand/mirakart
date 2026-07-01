import { ApiPropertyOptional } from "@nestjs/swagger";
import type { AttributeType } from "@prisma/client";
import { IsIn, IsOptional, IsString, MinLength } from "class-validator";

const ATTRIBUTE_TYPES: AttributeType[] = ["SELECT", "COLOR", "TEXT"];

export class UpdateAttributeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ enum: ATTRIBUTE_TYPES })
  @IsOptional()
  @IsIn(ATTRIBUTE_TYPES)
  type?: AttributeType;
}
