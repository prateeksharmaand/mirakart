import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { BadRequestException, ValidationPipe, VersioningType } from "@nestjs/common";
import type { ValidationError } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { execSync } from "child_process";
import { AppModule } from "./app.module";

function flattenValidationErrors(errors: ValidationError[]): Record<string, string[]> {
  const details: Record<string, string[]> = {};
  for (const error of errors) {
    if (error.constraints) {
      details[error.property] = Object.values(error.constraints);
    }
    if (error.children?.length) {
      const nested = flattenValidationErrors(error.children);
      for (const [key, messages] of Object.entries(nested)) {
        details[`${error.property}.${key}`] = messages;
      }
    }
  }
  return details;
}

async function bootstrap() {
  console.log("Running database migrations...");
  try {
    execSync("npx prisma migrate deploy --skip-generate", { stdio: "inherit" });
    console.log("Database migrations completed successfully");
  } catch (error) {
    console.error("Warning: Database migration failed", error);
  }
  // rawBody: true populates request.rawBody (Buffer) alongside the parsed
  // JSON body, needed to verify the Razorpay webhook's HMAC signature
  // against the exact bytes received (see payments/payments.controller.ts).
  const app = await NestFactory.create(AppModule, { bufferLogs: true, rawBody: true });
  const config = app.get(ConfigService);

  app.use(helmet());
  app.enableCors({
    origin: config.get<string>("CORS_ORIGINS", "").split(",").filter(Boolean),
    credentials: true,
  });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) =>
        new BadRequestException({
          message: "Validation failed",
          details: flattenValidationErrors(errors),
        }),
    }),
  );

  if (config.get<string>("NODE_ENV") !== "production") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("Mirakart API")
      .setDescription("Multi-vendor ecommerce platform API")
      .setVersion("1.0")
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api/docs", app, document);
  }

  const port = config.get<number>("PORT", 4000);
  await app.listen(port);
}

bootstrap();
