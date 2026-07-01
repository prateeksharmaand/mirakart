import { Catch, HttpException, HttpStatus, Logger, type ArgumentsHost, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";

const CODE_BY_STATUS: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: "BAD_REQUEST",
  [HttpStatus.UNAUTHORIZED]: "UNAUTHORIZED",
  [HttpStatus.FORBIDDEN]: "FORBIDDEN",
  [HttpStatus.NOT_FOUND]: "NOT_FOUND",
  [HttpStatus.CONFLICT]: "CONFLICT",
  [HttpStatus.TOO_MANY_REQUESTS]: "TOO_MANY_REQUESTS",
};

/**
 * Reshapes every thrown error into the documented envelope
 * (docs/api-contracts.md → Conventions):
 *   { success: false, error: { code, message, details? } }
 * `code` is derived from the HTTP status (or "VALIDATION_ERROR" for the
 * ValidationPipe's structured payload, see main.ts's exceptionFactory) —
 * not a bespoke per-business-rule code catalog.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (!(exception instanceof HttpException)) {
      this.logger.error("Unhandled exception", exception instanceof Error ? exception.stack : exception);
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" },
      });
      return;
    }

    const status = exception.getStatus();
    const body = exception.getResponse();
    const isStructured = typeof body === "object" && body !== null;
    const details = isStructured ? (body as { details?: Record<string, string[]> }).details : undefined;
    const message = isStructured
      ? ((body as { message?: string | string[] }).message ?? exception.message)
      : exception.message;

    response.status(status).json({
      success: false,
      error: {
        code: details ? "VALIDATION_ERROR" : (CODE_BY_STATUS[status] ?? "ERROR"),
        message: Array.isArray(message) ? message.join(", ") : message,
        ...(details ? { details } : {}),
      },
    });
  }
}
