import { applyDecorators, UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { PermissionGuard } from "../guards/permission.guard";
import { PrincipalAuthGuard } from "../guards/principal-auth.guard";
import { RequirePrincipal } from "./principal-type.decorator";
import { RequirePermission } from "./require-permission.decorator";

/**
 * Admin-only route. Pass a permission code (e.g. "product.approve") to also
 * enforce RBAC via PermissionGuard — omit it for admin routes that any
 * active admin may call regardless of role (e.g. "view my own profile").
 * isSuperAdmin always bypasses the permission check.
 */
export const AdminAuth = (permissionCode?: string) =>
  applyDecorators(
    RequirePrincipal("ADMIN"),
    ...(permissionCode ? [RequirePermission(permissionCode)] : []),
    UseGuards(PrincipalAuthGuard, PermissionGuard),
    ApiBearerAuth(),
  );

export const MerchantAuth = () =>
  applyDecorators(RequirePrincipal("MERCHANT"), UseGuards(PrincipalAuthGuard), ApiBearerAuth());

export const CustomerAuth = () =>
  applyDecorators(RequirePrincipal("CUSTOMER"), UseGuards(PrincipalAuthGuard), ApiBearerAuth());

/** Allows any authenticated principal type — used by shared endpoints like /notifications. */
export const AnyPrincipalAuth = () =>
  applyDecorators(
    RequirePrincipal("ADMIN", "MERCHANT", "CUSTOMER"),
    UseGuards(PrincipalAuthGuard),
    ApiBearerAuth(),
  );
