import { Module } from "@nestjs/common";
import { AdminBannersController } from "./admin-banners.controller";
import { BannersController } from "./banners.controller";
import { BannersRepository } from "./banners.repository";
import { BannersService } from "./banners.service";

@Module({
  controllers: [BannersController, AdminBannersController],
  providers: [BannersService, BannersRepository],
  exports: [BannersService],
})
export class BannersModule {}
