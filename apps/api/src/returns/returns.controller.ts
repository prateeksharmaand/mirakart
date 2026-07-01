import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { CustomerAuth } from "../auth/decorators/auth.decorators";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedPrincipal } from "../auth/types/jwt-payload.interface";
import { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import { CreateReturnDto } from "./dto/create-return.dto";
import { ReturnsService } from "./returns.service";

@ApiTags("returns")
@Controller()
export class ReturnsController {
  constructor(private readonly service: ReturnsService) {}

  @Get("return-reasons")
  @ApiOkResponse()
  listReasons() {
    return this.service.listReasons();
  }

  @Post("returns")
  @CustomerAuth()
  @ApiCreatedResponse()
  create(@Body() dto: CreateReturnDto, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.create(user.id, dto);
  }

  @Get("returns")
  @CustomerAuth()
  @ApiOkResponse()
  list(@Query() query: PaginationQueryDto, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.listForCustomer(user.id, query.page, query.limit);
  }

  @Get("returns/:id")
  @CustomerAuth()
  @ApiOkResponse()
  findOne(@Param("id") id: string, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.findForCustomer(id, user.id);
  }

  @Patch("returns/:id/cancel")
  @CustomerAuth()
  @ApiOkResponse()
  cancel(@Param("id") id: string, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.cancel(id, user.id);
  }
}
