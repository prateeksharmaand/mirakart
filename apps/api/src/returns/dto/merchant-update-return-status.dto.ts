import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsNumber, IsOptional, Min } from "class-validator";

const MERCHANT_SETTABLE_STATUSES = ["ITEM_RECEIVED", "COMPLETED"] as const;

export class MerchantUpdateReturnStatusDto {
  @ApiProperty({ enum: MERCHANT_SETTABLE_STATUSES })
  @IsIn(MERCHANT_SETTABLE_STATUSES)
  status!: (typeof MERCHANT_SETTABLE_STATUSES)[number];

  @ApiPropertyOptional({ description: "Only meaningful when status is COMPLETED." })
  @IsOptional()
  @IsNumber()
  @Min(0)
  refundAmount?: number;
}
