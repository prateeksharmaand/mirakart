import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("health")
@Controller("health")
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
