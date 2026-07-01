import { Body, Controller, Get, Param, Patch, Query } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { MerchantAuth } from "../auth/decorators/auth.decorators";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedPrincipal } from "../auth/types/jwt-payload.interface";
import { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import { MerchantUpdateReturnStatusDto } from "./dto/merchant-update-return-status.dto";
import { RejectReturnDto } from "./dto/reject-return.dto";
import { ReturnsService } from "./returns.service";

@ApiTags("merchant-returns")
@MerchantAuth()
@Controller("merchants/me/returns")
export class MerchantReturnsController {
  constructor(private readonly service: ReturnsService) {}

  @Get()
  @ApiOkResponse()
  list(@Query() query: PaginationQueryDto, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.listForMerchant(user.id, query.page, query.limit);
  }

  @Get(":id")
  @ApiOkResponse()
  findOne(@Param("id") id: string, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.findForMerchant(id, user.id);
  }

  @Patch(":id/approve")
  @ApiOkResponse()
  approve(@Param("id") id: string, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.approve(id, user.id);
  }

  @Patch(":id/reject")
  @ApiOkResponse()
  reject(@Param("id") id: string, @Body() dto: RejectReturnDto, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.reject(id, user.id, dto.note);
  }

  @Patch(":id/status")
  @ApiOkResponse()
  updateStatus(
    @Param("id") id: string,
    @Body() dto: MerchantUpdateReturnStatusDto,
    @CurrentUser() user: AuthenticatedPrincipal,
  ) {
    return this.service.merchantUpdateStatus(id, user.id, dto);
  }
}
