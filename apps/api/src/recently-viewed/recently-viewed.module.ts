import { Module } from "@nestjs/common";
import { RecentlyViewedController } from "./recently-viewed.controller";
import { RecentlyViewedRepository } from "./recently-viewed.repository";

@Module({
  controllers: [RecentlyViewedController],
  providers: [RecentlyViewedRepository],
  exports: [RecentlyViewedRepository],
})
export class RecentlyViewedModule {}
