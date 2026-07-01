import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { AddressType } from "@prisma/client";
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

const ADDRESS_TYPES: AddressType[] = ["SHIPPING", "BILLING", "BOTH"];

export class CreateAddressDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  label?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  fullName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(7)
  @MaxLength(20)
  phone!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  line1!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  line2?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  city!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  state!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(20)
  postalCode!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(60)
  country!: string;

  @ApiPropertyOptional({ enum: ADDRESS_TYPES, default: "BOTH" })
  @IsOptional()
  @IsIn(ADDRESS_TYPES)
  type?: AddressType;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
