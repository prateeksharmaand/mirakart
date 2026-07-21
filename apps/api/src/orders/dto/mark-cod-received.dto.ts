import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from "class-validator";

export class MarkCodReceivedDto {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amountReceived!: number;

  @ApiProperty()
  @IsDateString()
  receivedDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}
