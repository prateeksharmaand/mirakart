import { Module } from "@nestjs/common";
import { CartController } from "./cart.controller";
import { CartRepository } from "./cart.repository";
import { CartService } from "./cart.service";
import { CartLockService } from "./cart-lock.service";

@Module({
  controllers: [CartController],
  providers: [CartService, CartRepository, CartLockService],
  exports: [CartService, CartRepository, CartLockService],
})
export class CartModule {}
