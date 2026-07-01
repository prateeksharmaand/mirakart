import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthModule } from "./health/health.module";
import { MailModule } from "./mail/mail.module";
import { AuthModule } from "./auth/auth.module";
import { RbacModule } from "./auth/rbac.module";
import { AdminUsersModule } from "./admin-users/admin-users.module";
import { RolesModule } from "./roles/roles.module";
import { PermissionsModule } from "./permissions/permissions.module";
import { UploadsModule } from "./uploads/uploads.module";
import { MerchantsModule } from "./merchants/merchants.module";
import { CustomersModule } from "./customers/customers.module";
import { CategoriesModule } from "./categories/categories.module";
import { BrandsModule } from "./brands/brands.module";
import { AttributesModule } from "./attributes/attributes.module";
import { ProductsModule } from "./products/products.module";
import { CartModule } from "./cart/cart.module";
import { OrdersModule } from "./orders/orders.module";
import { PaymentsModule } from "./payments/payments.module";
import { ReturnsModule } from "./returns/returns.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { SettingsModule } from "./settings/settings.module";
import { BannersModule } from "./banners/banners.module";
import { ReportsModule } from "./reports/reports.module";

// All modules from the docs/architecture.md build order are now
// registered. Future modules (Wallet, Coupons, etc.) are explicitly out
// of scope per the Project Goal — see docs/architecture.md.
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env"] }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    MailModule,
    RbacModule,
    HealthModule,
    AuthModule,
    AdminUsersModule,
    RolesModule,
    PermissionsModule,
    UploadsModule,
    MerchantsModule,
    CustomersModule,
    CategoriesModule,
    BrandsModule,
    AttributesModule,
    ProductsModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    ReturnsModule,
    NotificationsModule,
    SettingsModule,
    BannersModule,
    ReportsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
