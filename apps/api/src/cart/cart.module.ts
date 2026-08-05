import { Module } from "@nestjs/common";
import { CouponsModule } from "../coupons/coupons.module";
import { CartController } from "./cart.controller";
import { CartRepository } from "./cart.repository";
import { CartService } from "./cart.service";
import { CartLockService } from "./cart-lock.service";

@Module({
  imports: [CouponsModule],
  controllers: [CartController],
  providers: [CartService, CartRepository, CartLockService],
  exports: [CartService, CartRepository, CartLockService],
})
export class CartModule {}
