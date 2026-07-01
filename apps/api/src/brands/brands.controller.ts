import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { AdminAuth } from "../auth/decorators/auth.decorators";
import { BrandsService } from "./brands.service";
import { CreateBrandDto } from "./dto/create-brand.dto";
import { UpdateBrandDto } from "./dto/update-brand.dto";

@ApiTags("brands")
@Controller("brands")
export class BrandsController {
  constructor(private readonly service: BrandsService) {}

  @Get()
  @ApiOkResponse()
  list() {
    return this.service.list();
  }

  @Get("admin/all")
  @AdminAuth("brand.view")
  @ApiOkResponse({ description: "Flat list including inactive brands" })
  listForAdmin() {
    return this.service.listForAdmin();
  }

  @Get(":slug")
  @ApiOkResponse()
  findBySlug(@Param("slug") slug: string) {
    return this.service.findBySlug(slug);
  }

  @Post()
  @AdminAuth("brand.create")
  @ApiCreatedResponse()
  create(@Body() dto: CreateBrandDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  @AdminAuth("brand.edit")
  @ApiOkResponse()
  update(@Param("id") id: string, @Body() dto: UpdateBrandDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @AdminAuth("brand.delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
