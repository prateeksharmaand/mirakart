import { Body, Controller, Post, Req } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import { AuthService } from "../auth.service";
import { AdminAuthResponseDto } from "../dto/auth-response.dto";
import { AdminLoginDto } from "../dto/admin-login.dto";
import { getRequestMeta } from "../utils/request-meta.util";

@ApiTags("auth")
@Controller("auth/admin")
export class AdminAuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  @ApiOkResponse({ type: AdminAuthResponseDto })
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  login(@Body() dto: AdminLoginDto, @Req() req: Request) {
    return this.auth.adminLogin(dto, getRequestMeta(req));
  }
}
