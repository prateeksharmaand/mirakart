import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { AdminAuth } from "../auth/decorators/auth.decorators";
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { ListCategoriesDto } from "./dto/list-categories.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { IsBoolean, IsInt, IsOptional, IsString } from "class-validator";
import { Transform } from "class-transformer";

class AssignAttributeDto {
  @IsString()
  attributeId!: string;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => Number(value))
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}

@ApiTags("categories")
@Controller("categories")
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  @ApiOkResponse()
  list(@Query() query: ListCategoriesDto) {
    return this.service.list(query.flat === "true");
  }

  @Get("admin/all")
  @AdminAuth("category.view")
  @ApiOkResponse({ description: "Flat list including inactive categories" })
  listForAdmin() {
    return this.service.listForAdmin();
  }

  @Get(":slug")
  @ApiOkResponse()
  findBySlug(@Param("slug") slug: string) {
    return this.service.findBySlug(slug);
  }

  @Post()
  @AdminAuth("category.create")
  @ApiCreatedResponse()
  create(@Body() dto: CreateCategoryDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  @AdminAuth("category.edit")
  @ApiOkResponse()
  update(@Param("id") id: string, @Body() dto: UpdateCategoryDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @AdminAuth("category.delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }

  // ── Category-Attribute assignment ──────────────────────────────────────────

  @Get(":id/attributes")
  @ApiOkResponse()
  getCategoryAttributes(@Param("id") id: string) {
    return this.service.getCategoryAttributesById(id);
  }

  @Post(":id/attributes")
  @AdminAuth("category.edit")
  @ApiCreatedResponse()
  assignAttribute(@Param("id") id: string, @Body() dto: AssignAttributeDto) {
    return this.service.assignAttribute(id, dto.attributeId, dto.sortOrder, dto.isRequired);
  }

  @Delete(":id/attributes/:attributeId")
  @AdminAuth("category.edit")
  @HttpCode(HttpStatus.NO_CONTENT)
  unassignAttribute(@Param("id") id: string, @Param("attributeId") attributeId: string) {
    return this.service.unassignAttribute(id, attributeId);
  }
}
