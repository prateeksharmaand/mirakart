import { Controller, Get, Query } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { MerchantAuth } from "../auth/decorators/auth.decorators";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedPrincipal } from "../auth/types/jwt-payload.interface";
import { ReportQueryDto, TopProductsQueryDto } from "./dto/report-query.dto";
import { ReportsService } from "./reports.service";

@ApiTags("merchant-reports")
@MerchantAuth()
@Controller("merchants/me/reports")
export class MerchantReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get("sales-summary")
  @ApiOkResponse()
  salesSummary(@Query() query: ReportQueryDto, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.merchantSalesSummary(user.id, query);
  }

  @Get("top-products")
  @ApiOkResponse()
  topProducts(@Query() query: TopProductsQueryDto, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.topProducts(query, user.id);
  }

  @Get("order-status-summary")
  @ApiOkResponse()
  orderStatusSummary(@CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.merchantOrderStatusSummary(user.id);
  }
}
