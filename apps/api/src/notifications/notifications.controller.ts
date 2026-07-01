import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { AnyPrincipalAuth } from "../auth/decorators/auth.decorators";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedPrincipal } from "../auth/types/jwt-payload.interface";
import { NotificationQueryDto } from "./dto/notification-query.dto";
import { RegisterDeviceTokenDto } from "./dto/register-device-token.dto";
import { NotificationsService } from "./notifications.service";

@ApiTags("notifications")
@AnyPrincipalAuth()
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @ApiOkResponse()
  list(@Query() query: NotificationQueryDto, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.list(
      user.type as "ADMIN" | "MERCHANT" | "CUSTOMER",
      user.id,
      query.unreadOnly ?? false,
      query.page,
      query.limit,
    );
  }

  @Patch(":id/read")
  @ApiOkResponse()
  markRead(@Param("id") id: string, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.markRead(id, user.type as "ADMIN" | "MERCHANT" | "CUSTOMER", user.id);
  }

  @Patch("read-all")
  @HttpCode(HttpStatus.NO_CONTENT)
  markAllRead(@CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.markAllRead(user.type as "ADMIN" | "MERCHANT" | "CUSTOMER", user.id);
  }

  @Post("device-tokens")
  @ApiCreatedResponse()
  registerDeviceToken(@Body() dto: RegisterDeviceTokenDto, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.registerDeviceToken(dto.token, user.type, user.id, dto.platform);
  }
}
