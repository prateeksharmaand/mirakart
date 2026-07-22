import { Body, Controller, Post, Req } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import { CustomerAuth } from "../decorators/auth.decorators";
import { CurrentUser } from "../decorators/current-user.decorator";
import type { AuthenticatedPrincipal } from "../types/jwt-payload.interface";
import { AuthService } from "../auth.service";
import { CustomerAuthResponseDto } from "../dto/auth-response.dto";
import { ChangePasswordDto } from "../dto/change-password.dto";
import { CustomerLoginDto } from "../dto/customer-login.dto";
import { CustomerRegisterDto } from "../dto/customer-register.dto";
import { getRequestMeta } from "../utils/request-meta.util";

@ApiTags("auth")
@Controller("auth/customer")
export class CustomerAuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  @ApiCreatedResponse({ type: CustomerAuthResponseDto })
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  register(@Body() dto: CustomerRegisterDto, @Req() req: Request) {
    return this.auth.customerRegister(dto, getRequestMeta(req));
  }

  @Post("login")
  @ApiOkResponse({ type: CustomerAuthResponseDto })
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  login(@Body() dto: CustomerLoginDto, @Req() req: Request) {
    return this.auth.customerLogin(dto, getRequestMeta(req));
  }

  @Post("change-password")
  @CustomerAuth()
  @ApiOkResponse()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  changePassword(@Body() dto: ChangePasswordDto, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.auth.changePassword("CUSTOMER", user.id, dto);
  }
}
