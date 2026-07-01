import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsNumber, Min } from "class-validator";
import { Type } from "class-transformer";

export class ListCategoriesDto {
  @ApiPropertyOptional({
    description: "If true, returns flat list. If false, returns hierarchical tree.",
    example: "true",
  })
  @IsOptional()
  @IsString()
  flat?: string;

  @ApiPropertyOptional({
    description: "Page number for pagination (1-indexed)",
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: "Number of items per page",
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    description: "Filter by active status",
    example: true,
  })
  @IsOptional()
  @IsString()
  isActive?: string;
}
