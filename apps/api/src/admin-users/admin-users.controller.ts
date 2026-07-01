import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { AdminUsersService } from "./admin-users.service";
import { AdminUserQueryDto } from "./dto/admin-user-query.dto";
import { CreateAdminUserDto } from "./dto/create-admin-user.dto";
import { UpdateAdminUserDto } from "./dto/update-admin-user.dto";
import { AdminAuth } from "../auth/decorators/auth.decorators";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedPrincipal } from "../auth/types/jwt-payload.interface";

@ApiTags("admin-users")
@Controller("admin-users")
export class AdminUsersController {
  constructor(private readonly service: AdminUsersService) {}

  @Get("me")
  @AdminAuth()
  @ApiOkResponse()
  me(@CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.findOne(user.id);
  }

  @Get()
  @AdminAuth("admin_user.view")
  @ApiOkResponse()
  list(@Query() query: AdminUserQueryDto) {
    return this.service.list(query);
  }

  @Get(":id")
  @AdminAuth("admin_user.view")
  @ApiOkResponse()
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @AdminAuth("admin_user.create")
  @ApiCreatedResponse()
  create(@Body() dto: CreateAdminUserDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  @AdminAuth("admin_user.edit")
  @ApiOkResponse()
  update(
    @Param("id") id: string,
    @Body() dto: UpdateAdminUserDto,
    @CurrentUser() user: AuthenticatedPrincipal,
  ) {
    return this.service.update(id, dto, user.id);
  }

  @Delete(":id")
  @AdminAuth("admin_user.delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.remove(id, user.id);
  }
}
