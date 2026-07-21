import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";

// Merchant fulfillment ladder per spec: Processing -> Packed -> Shipped.
// (Ready-for-pickup is presented as a UI label, not a distinct backend
// status — it's the same "PACKED, awaiting carrier" stage.)
const FULFILLMENT_STATUSES = ["PROCESSING", "PACKED", "SHIPPED"] as const;
export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];

export class UpdateFulfillmentStatusDto {
  @ApiProperty({ enum: FULFILLMENT_STATUSES })
  @IsIn(FULFILLMENT_STATUSES)
  status!: FulfillmentStatus;
}
