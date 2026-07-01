import { Controller, Get, VERSION_NEUTRAL } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("health")
@Controller({ path: "health", version: VERSION_NEUTRAL })
export class HealthController {
  @Get("ping")
  ping() {
    return { status: "ok", timestamp: new Date().toISOString() };
  }

  @Get()
  check() {
    return { status: "healthy" };
  }
}
