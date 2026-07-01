import { Module } from "@nestjs/common";
import { AdminProductsController } from "./admin-products.controller";
import { MerchantProductsController } from "./merchant-products.controller";
import { ProductsController } from "./products.controller";
import { ProductsRepository } from "./products.repository";
import { ProductsService } from "./products.service";

@Module({
  controllers: [ProductsController, MerchantProductsController, AdminProductsController],
  providers: [ProductsService, ProductsRepository],
  exports: [ProductsService],
})
export class ProductsModule {}
