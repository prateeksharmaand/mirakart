import { Body, Controller, Get, Param, Patch, Query } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { AdminAuth } from "../auth/decorators/auth.decorators";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedPrincipal } from "../auth/types/jwt-payload.interface";
import { AdminReturnQueryDto } from "./dto/admin-return-query.dto";
import { AdminUpdateReturnStatusDto } from "./dto/admin-update-return-status.dto";
import { ReturnsService } from "./returns.service";

@ApiTags("admin-returns")
@Controller("admin/returns")
export class AdminReturnsController {
  constructor(private readonly service: ReturnsService) {}

  @Get()
  @AdminAuth("return.view")
  @ApiOkResponse()
  list(@Query() query: AdminReturnQueryDto) {
    return this.service.listForAdmin(query);
  }

  @Get(":id")
  @AdminAuth("return.view")
  @ApiOkResponse()
  findOne(@Param("id") id: string) {
    return this.service.findForAdmin(id);
  }

  @Patch(":id/status")
  @AdminAuth("return.edit")
  @ApiOkResponse()
  updateStatus(
    @Param("id") id: string,
    @Body() dto: AdminUpdateReturnStatusDto,
    @CurrentUser() user: AuthenticatedPrincipal,
  ) {
    return this.service.adminOverride(id, user.id, dto);
  }
}
