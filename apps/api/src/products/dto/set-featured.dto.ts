import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

export class SetFeaturedDto {
  @ApiProperty()
  @IsBoolean()
  isFeatured!: boolean;
}
