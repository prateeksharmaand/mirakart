import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiQuery, ApiTags } from "@nestjs/swagger";
import { AdminAuth } from "../auth/decorators/auth.decorators";
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@ApiTags("categories")
@Controller("categories")
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  @ApiQuery({ name: "flat", required: false, type: Boolean })
  @ApiOkResponse()
  list(@Query("flat") flat?: string) {
    return this.service.list(flat === "true");
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
}
