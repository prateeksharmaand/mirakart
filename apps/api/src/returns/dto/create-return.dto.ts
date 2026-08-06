import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { ReturnResolutionType } from "@prisma/client";
import { IsArray, IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

const RESOLUTION_TYPES: ReturnResolutionType[] = ["REFUND", "REPLACEMENT"];

export class CreateReturnDto {
  @ApiProperty()
  @IsString()
  orderItemId!: string;

  @ApiProperty()
  @IsString()
  reasonId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reasonDetail?: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({ type: [String], description: "Media ids returned by POST /uploads (purpose: RETURN_IMAGES)" })
  @IsArray()
  @IsString({ each: true })
  imageMediaIds!: string[];

  @ApiPropertyOptional({ enum: RESOLUTION_TYPES, default: "REFUND" })
  @IsOptional()
  @IsIn(RESOLUTION_TYPES)
  resolutionType?: ReturnResolutionType;

  @ApiPropertyOptional({ description: "Required when resolutionType is REPLACEMENT — must be a variant of the same product" })
  @IsOptional()
  @IsString()
  replacementVariantId?: string;
}
