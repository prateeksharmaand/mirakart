import { Module } from "@nestjs/common";
import { CouponsRepository } from "./coupons.repository";
import { CouponsService } from "./coupons.service";
import { MerchantCouponsController } from "./merchant-coupons.controller";

@Module({
  controllers: [MerchantCouponsController],
  providers: [CouponsService, CouponsRepository],
  exports: [CouponsService],
})
export class CouponsModule {}
