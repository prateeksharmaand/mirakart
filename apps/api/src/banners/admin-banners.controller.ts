import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { AdminAuth } from "../auth/decorators/auth.decorators";
import { BannersService } from "./banners.service";
import { BannerQueryDto } from "./dto/banner-query.dto";
import { CreateBannerDto } from "./dto/create-banner.dto";
import { UpdateBannerDto } from "./dto/update-banner.dto";

@ApiTags("admin-banners")
@Controller("admin/banners")
export class AdminBannersController {
  constructor(private readonly service: BannersService) {}

  @Get()
  @AdminAuth("banner.view")
  @ApiOkResponse()
  list(@Query() query: BannerQueryDto) {
    return this.service.listForAdmin(query);
  }

  @Get(":id")
  @AdminAuth("banner.view")
  @ApiOkResponse()
  findOne(@Param("id") id: string) {
    return this.service.findById(id);
  }

  @Post()
  @AdminAuth("banner.create")
  @ApiCreatedResponse()
  create(@Body() dto: CreateBannerDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  @AdminAuth("banner.edit")
  @ApiOkResponse()
  update(@Param("id") id: string, @Body() dto: UpdateBannerDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @AdminAuth("banner.delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
