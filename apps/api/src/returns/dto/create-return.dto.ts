import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreateReturnDto {
  @ApiProperty()
  @IsString()
  orderItemId!: string;

  @ApiProperty()
  @IsString()
  reasonId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reasonDetail?: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({ type: [String], description: "Media ids returned by POST /uploads (purpose: RETURN_IMAGES)" })
  @IsArray()
  @IsString({ each: true })
  imageMediaIds!: string[];
}
