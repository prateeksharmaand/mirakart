import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req, UseGuards, type RawBodyRequest } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { CustomerAuth } from "../auth/decorators/auth.decorators";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { PrincipalAuthGuard } from "../auth/guards/principal-auth.guard";
import { RequirePrincipal } from "../auth/decorators/principal-type.decorator";
import type { AuthenticatedPrincipal } from "../auth/types/jwt-payload.interface";
import { PaymentsService, type RazorpayWebhookPayload } from "./payments.service";

@ApiTags("payments")
@Controller("payments")
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Post(":orderId/initiate")
  @CustomerAuth()
  @ApiOkResponse()
  initiate(@Param("orderId") orderId: string, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.initiate(orderId, user.id);
  }

  @Get(":orderId")
  @RequirePrincipal("CUSTOMER", "ADMIN")
  @UseGuards(PrincipalAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse()
  getPayment(@Param("orderId") orderId: string, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.getPayment(orderId, {
      type: user.type === "ADMIN" ? "ADMIN" : "CUSTOMER",
      id: user.id,
    });
  }

  @Post("webhook")
  @HttpCode(HttpStatus.OK)
  webhook(@Req() req: RawBodyRequest<Request>, @Body() body: Record<string, unknown>) {
    if (!req.rawBody) {
      throw new Error("Raw body capture is not configured — check NestFactory.create's rawBody option");
    }
    return this.service.handleWebhook(
      req.rawBody,
      req.headers["x-razorpay-signature"] as string | undefined,
      body as unknown as RazorpayWebhookPayload,
    );
  }
}
