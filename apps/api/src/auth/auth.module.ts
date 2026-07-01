import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthRepository } from "./auth.repository";
import { AuthService } from "./auth.service";
import { AdminAuthController } from "./controllers/admin-auth.controller";
import { AuthController } from "./controllers/auth.controller";
import { CustomerAuthController } from "./controllers/customer-auth.controller";
import { MerchantAuthController } from "./controllers/merchant-auth.controller";
import { JwtStrategy } from "./strategies/jwt.strategy";

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AdminAuthController, MerchantAuthController, CustomerAuthController, AuthController],
  providers: [AuthService, AuthRepository, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
