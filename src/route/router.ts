import type { OxarionRequest } from "../handler/request";
import type { OxarionResponse } from "../handler/response";
import type {
  Route,
  Method,
  ExtractRouteParams,
  Handler,
  MiddlewareFn,
} from "../types";
import { symbl_get_routes, type RoutesWrapper } from "./wrapper";
import { compose_middleware } from "../utils/middleware";
import { parseURLPath } from "../utils/parse_url";

export class Router {
  private routes: Route[] = [];
  private route_cache = new Map<string, Route>();
  private ws_routes = new Map<string, boolean>();

  /**
   * Registers a route handler for a specific HTTP method and path.
   * @template Path - The route path string type.
   * @param method - The HTTP method (e.g., "GET", "POST").
   * @param path - The route path (must start with "/").
   * @param handler - The function to handle the request and response.
   */
  addHandler<Path extends string>(
    method: Method,
    path: Path,
    handler: (
      req: OxarionRequest<ExtractRouteParams<Path>>,
      res: OxarionResponse
    ) => void | Promise<void>
  ) {
    if (typeof method !== "string")
      throw new TypeError("[Oxarion] addHandler: method must be a string");
    if (typeof path !== "string")
      throw new TypeError("[Oxarion] addHandler: path must be a string");
    if (typeof handler !== "function")
      throw new TypeError("[Oxarion] addHandler: handler must be a function");
    if (path[0] !== "/")
      throw new Error(
        `[Oxarion] addHandler: path must start with '/', received: "${path}"`
      );

    const segments: string[] = [];
    const param_names: string[] = [];
    let is_static = true;
    let i = 1;
    let start = 1;

    while (i <= path.length) {
      if (i === path.length || path[i] === "/") {
        if (i > start) {
          const segment = path.slice(start, i);
          segments.push(segment);
          if (segment[0] === "[") {
            is_static = false;
            const is_catch_all = segment.startsWith("[...");
            param_names.push(
              is_catch_all ? segment.slice(4, -1) : segment.slice(1, -1)
            );
          }
        }
        start = i + 1;
      }
      i++;
    }

    const route: Route = {
      method,
      handler: handler as Handler,
      segments,
      paramNames: param_names,
      isStatic: is_static,
    };

    this.routes.push(route);

    if (is_static) {
      this.route_cache.set(`${method}:${path}`, route);
    }
  }

  /**
   * Marks a route as a WebSocket endpoint.
   * @param path - The WebSocket route path (must start with '/').
   * @throws If path is not a string or does not start with '/'.
   */
  switchToWs(path: string) {
    if (typeof path !== "string")
      throw new TypeError("[Oxarion] switchToWs: path must be a string");
    if (path[0] !== "/")
      throw new Error(
        `[Oxarion] switchToWs: path must start with '/', received: "${path}"`
      );

    this.ws_routes.set(path, true);
  }

  /**
   * Injects all routes from a RoutesWrapper under a given base path.
   * @param base - The base path to prefix to all injected routes.
   * @param wrapper - The RoutesWrapper instance containing routes to inject.
   * @throws If base is not a string or wrapper is not a valid RoutesWrapper.
   */
  injectWrapper(base: string, wrapper: RoutesWrapper) {
    if (typeof base !== "string")
      throw new TypeError("[Oxarion] injectWrapper: base must be a string");
    if (
      typeof wrapper !== "object" ||
      wrapper === null ||
      typeof wrapper[symbl_get_routes] !== "function"
    )
      throw new TypeError(
        "[Oxarion] injectWrapper: wrapper must be a RoutesWrapper"
      );

    const base_clean = base.replace(/\/$/, "");
    const routes = wrapper[symbl_get_routes]();
    let i = routes.length;

    while (i--) {
      const { method, path, handler } = routes[i];
      this.addHandler(
        method,
        `${base_clean}/${path.replace(/^\//, "")}`,
        handler
      );
    }
  }

  /**
   * Applies a middleware function to routes matching a base path.
   * @param base - The base path to match (must start with "/").
   * @param middleware_fn - The middleware function to apply.
   * @param allRoutes - If true, applies to all routes; otherwise, only those starting with base.
   * @throws If base is not a string, does not start with "/", or middleware_fn is not a function.
   */
  middleware(base: string, middleware_fn: MiddlewareFn, allRoutes = false) {
    if (typeof base !== "string")
      throw new TypeError("[Oxarion] middleware: base must be a string");
    if (typeof middleware_fn !== "function")
      throw new TypeError(
        "[Oxarion] middleware: middleware_fn must be a function"
      );
    if (base[0] !== "/")
      throw new Error(
        `[Oxarion] middleware: base must start with "/", received: "${base}"`
      );

    const routes = allRoutes
      ? this.dump_routes()
      : this.dump_routes().filter((r) => r.path.startsWith(base));

    let i = routes.length;
    while (i--) {
      const { method, path, handler } = routes[i];
      this.addHandler(method, path, async (req, res) => {
        await middleware_fn(req, res, async () => {
          await handler(req, res);
        });
      });
    }
  }

  /**
   * Applies a chain of middleware functions to routes matching a base path.
   * @param base - The base path to match (must start with "/").
   * @param middlewares - An array of middleware functions to apply in order.
   * @param allRoutes - If true, applies to all routes; otherwise, only those starting with base.
   * @throws If base is not a string, does not start with "/", or middlewares is not an array of functions.
   */
  middlewareChain(
    base: string,
    middlewares: MiddlewareFn[],
    allRoutes = false
  ) {
    if (typeof base !== "string")
      throw new TypeError("[Oxarion] middlewareChain: base must be a string");
    if (
      !Array.isArray(middlewares) ||
      !middlewares.every((fn) => typeof fn === "function")
    )
      throw new TypeError(
        "[Oxarion] middlewareChain: middlewares must be an array of functions"
      );
    if (base[0] !== "/")
      throw new Error(
        `[Oxarion] middlewareChain: base must start with "/", received: "${base}"`
      );

    const routes = allRoutes
      ? this.dump_routes()
      : this.dump_routes().filter((r) => r.path.startsWith(base));

    let i = routes.length;

    while (i--) {
      const { method, path, handler } = routes[i];
      this.addHandler(method, path, (req, res) =>
        Promise.resolve(
          compose_middleware(middlewares, handler)(req, res)
        ).then(() => void 0)
      );
    }
  }

  finalize_routes() {
    let n = this.routes.length;
    while (n > 1) {
      let new_n = 0;
      let i = 1;
      while (i < n) {
        const a = this.routes[i - 1];
        const b = this.routes[i];
        if (
          (!a.isStatic && b.isStatic) ||
          (a.isStatic === b.isStatic && a.segments.length < b.segments.length)
        ) {
          [this.routes[i - 1], this.routes[i]] = [b, a];
          new_n = i;
        }
        i++;
      }
      n = new_n;
    }
  }

  match(
    method: string,
    pathname: string
  ): [Route, Record<string, string | string[]>] | null {
    const cache_key = `${method}:${pathname}`;
    const cached = this.route_cache.get(cache_key);
    if (cached) return [cached, {}];

    const url_segments: string[] = [];
    let i = 1,
      seg_start = 1;
    while (i <= pathname.length) {
      if (i === pathname.length || pathname[i] === "/") {
        if (i > seg_start) {
          url_segments.push(pathname.slice(seg_start, i));
        }
        seg_start = i + 1;
      }
      i++;
    }

    let r = 0;
    while (r < this.routes.length) {
      const route = this.routes[r++];
      if (route.method !== method) continue;

      const params: Record<string, string | string[]> = {};
      const segs = route.segments;
      const has_catch_all = segs.some((s) => s.startsWith("[..."));

      if (!has_catch_all && segs.length !== url_segments.length) continue;

      let matched = true;
      let seg_i = 0;
      let url_i = 0;

      while (seg_i < segs.length) {
        const seg = segs[seg_i++];
        if (seg[0] === "[") {
          if (seg.startsWith("[...")) {
            params[seg.slice(4, -1)] = url_segments.slice(url_i);
            break;
          } else {
            params[seg.slice(1, -1)] = url_segments[url_i];
          }
        } else if (seg !== url_segments[url_i]) {
          matched = false;
          break;
        }
        url_i++;
      }

      if (matched) return [route, params];
    }

    return null;
  }

  match_fast(method: string, url: string) {
    return this.match(method, parseURLPath(url));
  }

  dump_routes(): { method: Method; path: string; handler: Handler }[] {
    let i = this.routes.length;
    const result = new Array(i);

    while (i--) {
      const r = this.routes[i];
      result[i] = {
        method: r.method,
        path: "/" + r.segments.join("/"),
        handler: r.handler,
      };
    }

    return result;
  }

  is_ws_route(path: string): boolean {
    return this.ws_routes.has(path);
  }

  cleanup() {
    this.route_cache.clear();
    this.routes.length = 0;
  }
}
