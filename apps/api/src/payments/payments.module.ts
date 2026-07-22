import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { PaymentsController } from "./payments.controller";
import { PaymentsRepository } from "./payments.repository";
import { PaymentsService } from "./payments.service";
import { RazorpayService } from "./razorpay.service";
import { IdempotencyService } from "./idempotency.service";

@Module({
  imports: [NotificationsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentsRepository, RazorpayService, IdempotencyService],
  exports: [PaymentsService, IdempotencyService],
})
export class PaymentsModule {}
