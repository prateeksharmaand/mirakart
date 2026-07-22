import { Module } from "@nestjs/common";
import { AdminReportsController } from "./admin-reports.controller";
import { MerchantReportsController } from "./merchant-reports.controller";
import { ReportsRepository } from "./reports.repository";
import { ReportsService } from "./reports.service";

@Module({
  controllers: [AdminReportsController, MerchantReportsController],
  providers: [ReportsService, ReportsRepository],
  exports: [ReportsService],
})
export class ReportsModule {}
