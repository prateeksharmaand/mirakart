import { Injectable, type CallHandler, type ExecutionContext, type NestInterceptor } from "@nestjs/common";
import { map, type Observable } from "rxjs";

interface PaginatedShape {
  data: unknown;
  meta: Record<string, unknown>;
}

function isPaginatedShape(value: unknown): value is PaginatedShape {
  return (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    "meta" in value &&
    Object.keys(value).length === 2
  );
}

/**
 * Wraps every controller return value in the documented response envelope
 * (docs/api-contracts.md → Conventions). List endpoints already return
 * `{ data, meta }` from their service layer — those are spread as-is rather
 * than re-nested under another `data` key; everything else is wrapped
 * as `{ success: true, data: <value> }`. 204 No Content responses have no
 * body and are passed through untouched.
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((value: unknown) => {
        if (value === undefined) return value;
        if (isPaginatedShape(value)) {
          return { success: true, data: value.data, meta: value.meta };
        }
        return { success: true, data: value };
      }),
    );
  }
}
