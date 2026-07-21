import { Controller, Get, Query } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { AdminAuth } from "../auth/decorators/auth.decorators";
import { ReportQueryDto, TopProductsQueryDto } from "./dto/report-query.dto";
import { ReportsService } from "./reports.service";

@ApiTags("admin-reports")
@Controller("admin/reports")
export class AdminReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get("sales-summary")
  @AdminAuth("report.view")
  @ApiOkResponse()
  salesSummary(@Query() query: ReportQueryDto) {
    return this.service.adminSalesSummary(query);
  }

  @Get("top-products")
  @AdminAuth("report.view")
  @ApiOkResponse()
  topProducts(@Query() query: TopProductsQueryDto) {
    return this.service.topProducts(query);
  }

  @Get("cod-summary")
  @AdminAuth("report.view")
  @ApiOkResponse()
  codSummary() {
    return this.service.codOrderStats();
  }
}
