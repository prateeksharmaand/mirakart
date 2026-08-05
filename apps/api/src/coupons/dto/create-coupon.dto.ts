import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { CouponDiscountType } from "@prisma/client";
import { Type } from "class-transformer";
import { IsBoolean, IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from "class-validator";

const DISCOUNT_TYPES: CouponDiscountType[] = ["PERCENTAGE", "FIXED"];

export class CreateCouponDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  code!: string;

  @ApiProperty({ enum: DISCOUNT_TYPES })
  @IsIn(DISCOUNT_TYPES)
  discountType!: CouponDiscountType;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  discountValue!: number;

  @ApiPropertyOptional({ description: "Caps the discount amount for a PERCENTAGE coupon" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  maxDiscountAmount?: number;

  @ApiPropertyOptional({ description: "Minimum spend on this merchant's items required to use the coupon" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @ApiPropertyOptional({ description: "Total number of times this coupon can be redeemed across all customers" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @ApiPropertyOptional({ description: "Number of times a single customer may redeem this coupon" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  perCustomerLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
