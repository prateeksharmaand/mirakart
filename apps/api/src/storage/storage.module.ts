import { Module } from "@nestjs/common";
import { MediaRepository } from "./media.repository";
import { StorageService } from "./storage.service";

@Module({
  providers: [StorageService, MediaRepository],
  exports: [StorageService, MediaRepository],
})
export class StorageModule {}
