import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsRepository } from "./payments.repository";
import { PaymentsService } from "./payments.service";
import { RazorpayService } from "./razorpay.service";

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentsRepository, RazorpayService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
