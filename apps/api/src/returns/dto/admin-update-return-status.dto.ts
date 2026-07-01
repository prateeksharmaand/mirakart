import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { ReturnStatus } from "@prisma/client";
import { IsIn, IsNumber, IsOptional, IsString, Min, MaxLength } from "class-validator";

const RETURN_STATUSES: ReturnStatus[] = [
  "REQUESTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "AWAITING_SHIPMENT",
  "ITEM_RECEIVED",
  "COMPLETED",
  "CANCELLED",
];

export class AdminUpdateReturnStatusDto {
  @ApiProperty({ enum: RETURN_STATUSES })
  @IsIn(RETURN_STATUSES)
  status!: ReturnStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  refundAmount?: number;
}
