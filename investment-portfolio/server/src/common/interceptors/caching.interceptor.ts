import { Injectable } from "@nestjs/common";
import { HttpCacheInterceptor } from "./http-cache.interceptor";

/**
 * Backward-compatible name expected by implementation plan.
 */
@Injectable()
export class CachingInterceptor extends HttpCacheInterceptor {}
