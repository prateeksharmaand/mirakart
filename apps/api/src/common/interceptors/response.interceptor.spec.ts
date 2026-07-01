import type { CallHandler, ExecutionContext } from "@nestjs/common";
import { of } from "rxjs";
import { ResponseInterceptor } from "./response.interceptor";

describe("ResponseInterceptor", () => {
  const interceptor = new ResponseInterceptor();
  const context = {} as ExecutionContext;
  const handlerReturning = (value: unknown): CallHandler => ({ handle: () => of(value) });

  it("wraps a plain entity as { success: true, data }", async () => {
    const result = await firstValue(interceptor.intercept(context, handlerReturning({ id: "p1" })));
    expect(result).toEqual({ success: true, data: { id: "p1" } });
  });

  it("wraps an array as { success: true, data: [...] }", async () => {
    const result = await firstValue(interceptor.intercept(context, handlerReturning([{ id: "1" }, { id: "2" }])));
    expect(result).toEqual({ success: true, data: [{ id: "1" }, { id: "2" }] });
  });

  it("spreads a { data, meta } pagination shape instead of re-nesting it", async () => {
    const paginated = { data: [{ id: "1" }], meta: { page: 1, limit: 20, totalItems: 1, totalPages: 1 } };
    const result = await firstValue(interceptor.intercept(context, handlerReturning(paginated)));
    expect(result).toEqual({ success: true, data: paginated.data, meta: paginated.meta });
  });

  it("passes undefined through untouched (204 No Content)", async () => {
    const result = await firstValue(interceptor.intercept(context, handlerReturning(undefined)));
    expect(result).toBeUndefined();
  });
});

function firstValue<T>(observable: { subscribe: (cb: (value: T) => void) => void }): Promise<T> {
  return new Promise((resolve) => observable.subscribe(resolve));
}
