import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { AdminAuth } from "../auth/decorators/auth.decorators";
import { PermissionsService } from "./permissions.service";

@ApiTags("permissions")
@Controller("permissions")
export class PermissionsController {
  constructor(private readonly service: PermissionsService) {}

  @Get()
  @AdminAuth("role.view")
  @ApiOkResponse({ description: "Full permission catalog, grouped by module" })
  list() {
    return this.service.listGroupedByModule();
  }
}
