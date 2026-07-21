import { Module } from "@nestjs/common";
import { CartModule } from "../cart/cart.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { PaymentsModule } from "../payments/payments.module";
import { AdminOrdersController } from "./admin-orders.controller";
import { MerchantOrdersController } from "./merchant-orders.controller";
import { OrderItemsController } from "./order-items.controller";
import { OrdersController } from "./orders.controller";
import { OrdersRepository } from "./orders.repository";
import { OrdersService } from "./orders.service";

@Module({
  imports: [CartModule, NotificationsModule, PaymentsModule],
  controllers: [OrdersController, OrderItemsController, AdminOrdersController, MerchantOrdersController],
  providers: [OrdersService, OrdersRepository],
  exports: [OrdersService],
})
export class OrdersModule {}
