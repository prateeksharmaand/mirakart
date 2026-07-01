import { ForbiddenException, Injectable, type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import type { ActorType } from "@prisma/client";
import { PRINCIPAL_TYPE_KEY } from "../decorators/principal-type.decorator";
import type { AuthenticatedPrincipal } from "../types/jwt-payload.interface";

/**
 * Verifies the JWT (via the "jwt" Passport strategy), then checks the
 * token's principal type against whatever @RequirePrincipal(...) declared
 * on the route. A token issued for one principal space (e.g. Customer)
 * cannot be used against routes guarded for another (e.g. Merchant).
 */
@Injectable()
export class PrincipalAuthGuard extends AuthGuard("jwt") {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const isJwtValid = await super.canActivate(context);
    if (!isJwtValid) return false;

    const allowedTypes = this.reflector.getAllAndOverride<ActorType[]>(PRINCIPAL_TYPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!allowedTypes || allowedTypes.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedPrincipal = request.user;
    if (!allowedTypes.includes(user.type)) {
      throw new ForbiddenException("This token is not valid for this resource");
    }
    return true;
  }
}
