import { Global, Module } from "@nestjs/common";
import { PermissionGuard } from "./guards/permission.guard";
import { RbacRepository } from "./rbac.repository";

/**
 * Global because PermissionGuard (used by every module's @AdminAuth(code)
 * routes) depends on RbacRepository, a custom provider — Nest only resolves
 * a @UseGuards()-referenced class within the consuming module's own scope,
 * and framework-internal deps like Reflector resolve anywhere but
 * user-defined ones like this don't unless exported from a module the
 * caller imports. Making this @Global() avoids every feature module having
 * to `imports: [AuthModule]` just to use admin permission checks.
 */
@Global()
@Module({
  providers: [RbacRepository, PermissionGuard],
  exports: [RbacRepository, PermissionGuard],
})
export class RbacModule {}
