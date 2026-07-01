import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsRepository } from "./payments.repository";
import { PaymentsService } from "./payments.service";
import { RazorpayService } from "./razorpay.service";
import { IdempotencyService } from "./idempotency.service";

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentsRepository, RazorpayService, IdempotencyService],
  exports: [PaymentsService, IdempotencyService],
})
export class PaymentsModule {}
