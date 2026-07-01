import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { AuthenticatedPrincipal } from "../types/jwt-payload.interface";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedPrincipal => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
