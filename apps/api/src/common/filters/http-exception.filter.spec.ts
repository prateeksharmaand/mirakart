import { BadRequestException, ConflictException, NotFoundException, type ArgumentsHost } from "@nestjs/common";
import { HttpExceptionFilter } from "./http-exception.filter";

describe("HttpExceptionFilter", () => {
  const filter = new HttpExceptionFilter();

  function hostWithMockResponse() {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = { switchToHttp: () => ({ getResponse: () => ({ status }) }) } as unknown as ArgumentsHost;
    return { host, status, json };
  }

  it("reshapes a plain HttpException into the documented error envelope", () => {
    const { host, status, json } = hostWithMockResponse();
    filter.catch(new NotFoundException("Merchant not found"), host);
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: { code: "NOT_FOUND", message: "Merchant not found" },
    });
  });

  it("maps a ConflictException to the CONFLICT code", () => {
    const { host, status, json } = hostWithMockResponse();
    filter.catch(new ConflictException("Already approved"), host);
    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: { code: "CONFLICT", message: "Already approved" },
    });
  });

  it("surfaces field-level details as VALIDATION_ERROR for the ValidationPipe's structured payload", () => {
    const { host, json } = hostWithMockResponse();
    filter.catch(
      new BadRequestException({ message: "Validation failed", details: { email: ["must be a valid email"] } }),
      host,
    );
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: { email: ["must be a valid email"] },
      },
    });
  });

  it("falls back to INTERNAL_SERVER_ERROR for a non-HttpException", () => {
    const { host, status, json } = hostWithMockResponse();
    filter.catch(new Error("boom"), host);
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" },
    });
  });
});
