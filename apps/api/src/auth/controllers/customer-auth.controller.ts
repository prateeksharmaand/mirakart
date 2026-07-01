import { Body, Controller, Post, Req } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import { AuthService } from "../auth.service";
import { CustomerAuthResponseDto } from "../dto/auth-response.dto";
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
}
