import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";

const MERCHANT_SETTABLE_STATUSES = ["ITEM_RECEIVED", "COMPLETED"] as const;

export class MerchantUpdateReturnStatusDto {
  @ApiProperty({ enum: MERCHANT_SETTABLE_STATUSES })
  @IsIn(MERCHANT_SETTABLE_STATUSES)
  status!: (typeof MERCHANT_SETTABLE_STATUSES)[number];
}
