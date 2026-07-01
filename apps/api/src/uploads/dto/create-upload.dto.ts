import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";
import { UploadPurpose } from "../upload-purpose";

const PURPOSES = Object.values(UploadPurpose);

export class CreateUploadDto {
  @ApiProperty({ enum: PURPOSES })
  @IsIn(PURPOSES)
  purpose!: UploadPurpose;
}
