import { Controller, Get, Query } from "@nestjs/common";
import { ApiOkResponse, ApiQuery, ApiTags } from "@nestjs/swagger";
import type { BannerPosition } from "@prisma/client";
import { BannersService } from "./banners.service";

@ApiTags("banners")
@Controller("banners")
export class BannersController {
  constructor(private readonly service: BannersService) {}

  @Get()
  @ApiQuery({ name: "position", required: true })
  @ApiOkResponse()
  list(@Query("position") position: BannerPosition) {
    return this.service.listActive(position);
  }
}
