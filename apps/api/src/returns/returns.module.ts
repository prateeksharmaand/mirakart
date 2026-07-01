import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { AdminReturnsController } from "./admin-returns.controller";
import { MerchantReturnsController } from "./merchant-returns.controller";
import { ReturnsController } from "./returns.controller";
import { ReturnsRepository } from "./returns.repository";
import { ReturnsService } from "./returns.service";

@Module({
  imports: [NotificationsModule],
  controllers: [ReturnsController, MerchantReturnsController, AdminReturnsController],
  providers: [ReturnsService, ReturnsRepository],
  exports: [ReturnsService],
})
export class ReturnsModule {}
