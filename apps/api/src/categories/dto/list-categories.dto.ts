import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class ListCategoriesDto {
  @ApiPropertyOptional({
    description: "If true, returns flat list. If false, returns hierarchical tree.",
    example: "true",
  })
  @IsOptional()
  @IsString()
  flat?: string;
}
