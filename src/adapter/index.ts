import type { ServerWebSocket } from "bun";
import { OxarionRequest } from "../handler/request";
import { OxarionResponse } from "../handler/response";
import { WSWatcher } from "../handler/ws";
import { Router } from "../route/router";
import type { OxarionOptions, WSContext } from "../types";
import { parseURLPath } from "../utils/parse_url";
import { check_update } from "../utils/check_update";
import { check_bun_version } from "../utils/version_check";

export class Oxarion {
  private static readonly DEFAULT_HOST = "127.0.0.1";
  private static server: ReturnType<typeof Bun.serve> | null = null;
  private static router: Router | null = null;
  private static not_found_res = new Response("Not Found", { status: 404 });
  private static server_error_res = new Response("Internal Server Error", {
    status: 500,
  });

  /**
   * Starts the Oxarion server with the given options.
   * @param options - Server and routing options
   * @returns The Bun server instance
   * @throws If Bun is not available
   */
  static async start(options: OxarionOptions) {
    if (typeof Bun === "undefined")
      throw new Error("[Oxarion] Please install BunJs");

    const {
      host,
      port,
      idleTimeout,
      ipv6Only,
      pagesDir,
      reusePort,
      unix,
      debugRoutes,
      cachePages,
      wsHandler,
      checkLatestVersion,
    } = options;

    Oxarion.router = new Router();
    options.httpHandler(Oxarion.router);
    if (options.safeMwRegister) options.safeMwRegister(Oxarion.router);
    Oxarion.router.finalize_routes();

    const bun_ver = await check_bun_version();
    if (!bun_ver) return;

    if (checkLatestVersion !== false) await check_update();

    console.log(
      `[Oxarion] Server started on: http://${
        host || Oxarion.DEFAULT_HOST
      }:${port}`
    );

    Oxarion.server = Bun.serve({
      port,
      hostname: host,
      idleTimeout,
      ipv6Only,
      reusePort,
      unix,

      fetch: async (req, server) => {
        let start = 0;

        if (debugRoutes) start = performance.now();
        if (debugRoutes && Bun.env.NODE_ENV === "production")
          console.warn(
            "[Oxarion] Warning: debugRoutes is enabled in production. This will severely impact performance."
          );

        let ws_wacther: WSWatcher | undefined;

        if (!!wsHandler) {
          ws_wacther = new WSWatcher();
          wsHandler(ws_wacther);
        }

        try {
          const url = req.url;
          const method = req.method;

          const path = parseURLPath(url);
          if (!!wsHandler && Oxarion.router!.is_ws_route(path)) {
            const handler = ws_wacther!.getHandler(path);
            if (!handler)
              return new Response("No WebSocket handler for this path", {
                status: 404,
              });

            const success = server.upgrade(req, { data: { handler } });
            if (success) return new Response(null, { status: 101 });
            return new Response("Upgrade failed", { status: 400 });
          }

          const match = Oxarion.router!.match_fast(method, url);
          if (!match) {
            if (debugRoutes) {
              const end = performance.now();
              const path = parseURLPath(url);
              console.log(
                `${method} ${path} 404 (${(end - start).toFixed(2)}ms)`
              );
            }
            return Oxarion.not_found_res;
          }

          const [route, params] = match;
          const ox_req = new OxarionRequest(req, params);
          const res = new OxarionResponse(
            pagesDir || "pages",
            cachePages !== false,
            req
          );

          await route.handler(ox_req, res);
          const response = res.toResponse();

          if (debugRoutes) {
            const end = performance.now();
            const path = parseURLPath(url);
            console.log(
              `${method} ${path} ${response.status} (${(end - start).toFixed(
                2
              )}ms)`
            );
          }

          return response;
        } catch (err) {
          console.error("Handler error:", err);
          return Oxarion.server_error_res;
        }
      },

      websocket: {
        open(ws) {
          (ws as ServerWebSocket<WSContext>).data?.handler?.onOpen?.(ws);
        },
        message(ws, message) {
          (ws as ServerWebSocket<WSContext>).data?.handler?.onMessage?.(
            ws,
            message
          );
        },
        close(ws, code, reason) {
          (ws as ServerWebSocket<WSContext>).data?.handler?.onClose?.(
            ws,
            code,
            reason
          );
        },
        drain(ws) {
          (ws as ServerWebSocket<WSContext>).data?.handler?.onDrain?.(ws);
        },
      },

      error(error) {
        console.error("Server error:", error);
      },
    });

    return Oxarion.server;
  }

  /**
   * Stops the Oxarion server and cleans up resources.
   */
  static async stop() {
    if (Oxarion.server) {
      Oxarion.server.stop();
      Oxarion.server = null;
    }
    if (Oxarion.router) {
      Oxarion.router.cleanup();
      Oxarion.router = null;
    }
  }
}
