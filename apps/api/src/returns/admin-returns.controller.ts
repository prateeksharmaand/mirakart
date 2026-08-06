import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { AdminAuth } from "../auth/decorators/auth.decorators";
import { AdminReturnQueryDto } from "./dto/admin-return-query.dto";
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
}
