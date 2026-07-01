import { Body, Controller, Post, Req } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import { AuthService } from "../auth.service";
import { MerchantAuthResponseDto } from "../dto/auth-response.dto";
import { MerchantLoginDto } from "../dto/merchant-login.dto";
import { MerchantRegisterDto } from "../dto/merchant-register.dto";
import { getRequestMeta } from "../utils/request-meta.util";

@ApiTags("auth")
@Controller("auth/merchant")
export class MerchantAuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  @ApiCreatedResponse({ type: MerchantAuthResponseDto })
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  register(@Body() dto: MerchantRegisterDto, @Req() req: Request) {
    return this.auth.merchantRegister(dto, getRequestMeta(req));
  }

  @Post("login")
  @ApiOkResponse({ type: MerchantAuthResponseDto })
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  login(@Body() dto: MerchantLoginDto, @Req() req: Request) {
    return this.auth.merchantLogin(dto, getRequestMeta(req));
  }
}
