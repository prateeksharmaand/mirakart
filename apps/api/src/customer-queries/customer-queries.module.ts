import { Module } from "@nestjs/common";
import { CustomerQueriesController } from "./customer-queries.controller";
import { CustomerQueriesRepository } from "./customer-queries.repository";

@Module({
  controllers: [CustomerQueriesController],
  providers: [CustomerQueriesRepository],
  exports: [CustomerQueriesRepository],
})
export class CustomerQueriesModule {}
