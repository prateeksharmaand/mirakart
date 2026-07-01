import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";

export class ReviewDocumentDto {
  @ApiProperty({ enum: ["VERIFIED", "REJECTED"] })
  @IsIn(["VERIFIED", "REJECTED"])
  status!: "VERIFIED" | "REJECTED";
}
