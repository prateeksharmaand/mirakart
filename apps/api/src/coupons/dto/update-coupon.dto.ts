import { ApiPropertyOptional } from "@nestjs/swagger";
import type { CouponDiscountType } from "@prisma/client";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from "class-validator";

const DISCOUNT_TYPES: CouponDiscountType[] = ["PERCENTAGE", "FIXED"];

// `Type(() => Number)` would coerce an explicit `null` (used to clear the
// field) into 0 before validation ever sees it — this preserves null as-is.
const toNullableNumber = ({ value }: { value: unknown }) => (value === null ? null : Number(value));

export class UpdateCouponDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  code?: string;

  @ApiPropertyOptional({ enum: DISCOUNT_TYPES })
  @IsOptional()
  @IsIn(DISCOUNT_TYPES)
  discountType?: CouponDiscountType;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  discountValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toNullableNumber)
  @IsNumber()
  @Min(0.01)
  maxDiscountAmount?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toNullableNumber)
  @IsNumber()
  @Min(0)
  minOrderValue?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toNullableNumber)
  @IsInt()
  @Min(1)
  usageLimit?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toNullableNumber)
  @IsInt()
  @Min(1)
  perCustomerLimit?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startsAt?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;
}
