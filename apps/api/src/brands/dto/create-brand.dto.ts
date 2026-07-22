import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class CreateBrandDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ description: "Short code used as the Product ID prefix (e.g. NIKE). Auto-derived from the name if omitted." })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^[A-Z0-9]+$/, { message: "code must be uppercase letters and numbers only" })
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoMediaId?: string;
}
