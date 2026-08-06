import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { DispatchMethod } from "@prisma/client";
import { IsDateString, IsIn, IsOptional, IsString, MaxLength } from "class-validator";

const DISPATCH_METHODS: DispatchMethod[] = ["COURIER", "SELF_DELIVERY"];

// Curated dropdown per the spec — "Other" is a valid value too, at which
// point customCourierName carries the free-typed name. Not an enum in the
// DB: courierPartner is a plain string so a future courier API integration
// (Shiprocket/NimbusPost/Delhivery/Blue Dart) can populate it the same way.
export const COURIER_PARTNERS = [
  "Delhivery",
  "DTDC",
  "Blue Dart",
  "XpressBees",
  "Ecom Express",
  "India Post",
  "Shadowfax",
  "Other",
] as const;

export class DispatchOrderDto {
  @ApiProperty({ enum: DISPATCH_METHODS })
  @IsIn(DISPATCH_METHODS)
  dispatchMethod!: DispatchMethod;

  @ApiPropertyOptional({ enum: COURIER_PARTNERS, description: "Required when dispatchMethod is COURIER" })
  @IsOptional()
  @IsString()
  courierPartner?: string;

  @ApiPropertyOptional({ description: 'Required when courierPartner is "Other"' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  customCourierName?: string;

  @ApiPropertyOptional({ description: "Required when dispatchMethod is COURIER" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  trackingNumber?: string;

  @ApiPropertyOptional({ description: "Required when dispatchMethod is SELF_DELIVERY" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  deliveryPersonName?: string;

  @ApiPropertyOptional({ description: "Required when dispatchMethod is SELF_DELIVERY" })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  deliveryPersonPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  vehicleNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  shipmentNotes?: string;
}
