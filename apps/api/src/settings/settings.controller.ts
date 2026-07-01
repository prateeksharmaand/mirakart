import { Body, Controller, Get, Param, Patch, Query } from "@nestjs/common";
import { ApiOkResponse, ApiQuery, ApiTags } from "@nestjs/swagger";
import { AdminAuth } from "../auth/decorators/auth.decorators";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedPrincipal } from "../auth/types/jwt-payload.interface";
import { UpdateSettingDto } from "./dto/update-setting.dto";
import { SettingsService } from "./settings.service";

@ApiTags("admin-settings")
@Controller("admin/settings")
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get()
  @AdminAuth("setting.view")
  @ApiQuery({ name: "group", required: false })
  @ApiOkResponse()
  list(@Query("group") group?: string) {
    return this.service.list(group);
  }

  @Patch(":key")
  @AdminAuth("setting.edit")
  @ApiOkResponse()
  update(@Param("key") key: string, @Body() dto: UpdateSettingDto, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.update(key, dto, user.id);
  }
}
