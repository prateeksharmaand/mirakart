import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { ReportsModule } from "../reports/reports.module";
import { MerchantsController } from "./merchants.controller";
import { MerchantsRepository } from "./merchants.repository";
import { MerchantsService } from "./merchants.service";

@Module({
  imports: [NotificationsModule, ReportsModule],
  controllers: [MerchantsController],
  providers: [MerchantsService, MerchantsRepository],
  exports: [MerchantsService],
})
export class MerchantsModule {}
