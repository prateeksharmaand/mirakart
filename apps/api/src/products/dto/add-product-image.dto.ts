import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString } from "class-validator";

export class AddProductImageDto {
  @ApiProperty({ description: "Media id returned by POST /uploads (purpose: PRODUCT_IMAGES)" })
  @IsString()
  mediaId!: string;

  @ApiPropertyOptional({ description: "Attach this image to a specific variant rather than the whole product" })
  @IsOptional()
  @IsString()
  variantId?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
