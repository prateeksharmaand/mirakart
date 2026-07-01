import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDefined, IsOptional, IsString } from "class-validator";

export class UpdateSettingDto {
  @ApiProperty({ description: "Any JSON-serializable value" })
  @IsDefined()
  value!: unknown;

  @ApiPropertyOptional({ description: "Required only when creating a new setting key" })
  @IsOptional()
  @IsString()
  group?: string;
}
