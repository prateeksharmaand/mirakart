import type { OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { softDeleteMiddleware } from "./soft-delete.middleware";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    this.$use(softDeleteMiddleware);
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
