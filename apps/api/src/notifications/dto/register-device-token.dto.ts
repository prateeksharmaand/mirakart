import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString } from "class-validator";

const PLATFORMS = ["ANDROID", "IOS", "WEB"] as const;

export class RegisterDeviceTokenDto {
  @ApiProperty()
  @IsString()
  token!: string;

  @ApiPropertyOptional({ enum: PLATFORMS })
  @IsOptional()
  @IsIn(PLATFORMS)
  platform?: (typeof PLATFORMS)[number];
}
