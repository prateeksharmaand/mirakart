import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";

// Merchant fulfillment ladder: Processing -> Packed -> Ready To Ship ->
// Shipped -> Out For Delivery -> Delivered. Merchants drive the whole thing
// themselves now (no admin confirmation step); Complete Order is a separate
// action (see OrdersService.merchantCompleteOrder) since it's gated on
// payment being settled, unlike these purely-logistical steps.
const FULFILLMENT_STATUSES = [
  "PROCESSING",
  "PACKED",
  "READY_TO_SHIP",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;
export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];

export class UpdateFulfillmentStatusDto {
  @ApiProperty({ enum: FULFILLMENT_STATUSES })
  @IsIn(FULFILLMENT_STATUSES)
  status!: FulfillmentStatus;
}
