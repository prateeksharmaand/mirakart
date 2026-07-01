import { Module } from "@nestjs/common";
import { AttributesController } from "./attributes.controller";
import { AttributesRepository } from "./attributes.repository";
import { AttributesService } from "./attributes.service";

@Module({
  controllers: [AttributesController],
  providers: [AttributesService, AttributesRepository],
  exports: [AttributesService],
})
export class AttributesModule {}
