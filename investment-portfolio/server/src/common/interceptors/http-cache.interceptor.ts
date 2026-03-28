import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable, of } from "rxjs";
import { tap } from "rxjs/operators";

/**
 * Simple in-process cache interceptor.
 * Cache-Control headers are respected: responses are not cached when
 * Cache-Control: no-cache / no-store is present.
 * Cache is invalidated on non-GET requests to the same base path.
 */
@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  private readonly cache = new Map<
    string,
    { data: unknown; expiresAt: number }
  >();
  private readonly defaultTtlMs = 30_000; // 30 seconds

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const method: string = req.method?.toUpperCase();

    // Invalidate cache for mutating operations
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      const basePath = req.path?.split("/").slice(0, 3).join("/");
      for (const key of this.cache.keys()) {
        if (key.startsWith(basePath)) this.cache.delete(key);
      }
      return next.handle();
    }

    // Skip cache if client opts out
    const cacheControl = req.headers?.["cache-control"] ?? "";
    if (
      cacheControl.includes("no-cache") ||
      cacheControl.includes("no-store")
    ) {
      return next.handle();
    }

    const cacheKey = `${req.path}?${new URLSearchParams(req.query).toString()}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return of(cached.data);
    }

    return next.handle().pipe(
      tap((data) => {
        this.cache.set(cacheKey, {
          data,
          expiresAt: Date.now() + this.defaultTtlMs,
        });
      }),
    );
  }
}
