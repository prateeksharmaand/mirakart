import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { AdminAuth } from "../auth/decorators/auth.decorators";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { RolesService } from "./roles.service";

@ApiTags("roles")
@Controller("roles")
export class RolesController {
  constructor(private readonly service: RolesService) {}

  @Get()
  @AdminAuth("role.view")
  @ApiOkResponse()
  list() {
    return this.service.list();
  }

  @Get(":id")
  @AdminAuth("role.view")
  @ApiOkResponse()
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @AdminAuth("role.create")
  @ApiCreatedResponse()
  create(@Body() dto: CreateRoleDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  @AdminAuth("role.edit")
  @ApiOkResponse()
  update(@Param("id") id: string, @Body() dto: UpdateRoleDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @AdminAuth("role.delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
