import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { AdminAuth } from "../auth/decorators/auth.decorators";
import { TagsService } from "./tags.service";
import { CreateTagDto } from "./dto/create-tag.dto";
import { UpdateTagDto } from "./dto/update-tag.dto";
import { TagQueryDto } from "./dto/tag-query.dto";

@ApiTags("tags")
@Controller("tags")
export class TagsController {
  constructor(private readonly service: TagsService) {}

  @Get()
  @ApiOkResponse({ description: "Active tags (public)" })
  listActive() {
    return this.service.listActive();
  }

  @Get("admin/all")
  @AdminAuth("tag.view")
  @ApiOkResponse({ description: "All tags with pagination (admin)" })
  listAdmin(@Query() query: TagQueryDto) {
    return this.service.listAdmin(query);
  }

  @Get(":id")
  @AdminAuth("tag.view")
  @ApiOkResponse()
  findById(@Param("id") id: string) {
    return this.service.findById(id);
  }

  @Post()
  @AdminAuth("tag.create")
  @ApiCreatedResponse()
  create(@Body() dto: CreateTagDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  @AdminAuth("tag.edit")
  @ApiOkResponse()
  update(@Param("id") id: string, @Body() dto: UpdateTagDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @AdminAuth("tag.delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
