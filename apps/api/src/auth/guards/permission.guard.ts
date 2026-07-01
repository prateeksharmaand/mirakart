import { ForbiddenException, Injectable, type CanActivate, type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMISSION_KEY } from "../decorators/require-permission.decorator";
import { RbacRepository } from "../rbac.repository";
import type { AuthenticatedPrincipal } from "../types/jwt-payload.interface";

/**
 * Runs after PrincipalAuthGuard (which already validated the JWT and
 * principal type). Looks up the admin's role permissions fresh on every
 * request rather than trusting the JWT payload, so a permission revoked
 * mid-session takes effect immediately rather than waiting for token expiry.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rbac: RbacRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredCode = this.reflector.getAllAndOverride<string | undefined>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredCode) return true;

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedPrincipal = request.user;

    const authorization = await this.rbac.getAdminAuthorization(user.id);
    if (!authorization) throw new ForbiddenException("Account is no longer accessible");
    if (authorization.isSuperAdmin) return true;
    if (!authorization.permissionCodes.includes(requiredCode)) {
      throw new ForbiddenException(`Missing required permission: ${requiredCode}`);
    }
    return true;
  }
}
