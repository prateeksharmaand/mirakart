import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";

export class RejectReturnDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  note!: string;
}
