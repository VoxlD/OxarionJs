import type { ServerWebSocket } from "bun";
import type { OxarionRequest } from "./handler/request";
import type { OxarionResponse } from "./handler/response";
import { Router } from "./route/router";
import type { WSWatcher } from "./handler/ws";

export type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS";

export type Handler = (
  req: OxarionRequest<any>,
  res: OxarionResponse
) => void | Promise<void>;

export interface Route {
  method: Method;
  handler: Handler;
  segments: string[];
  paramNames: string[];
  isStatic: boolean;
}

export interface OxarionOptions {
  /**
   * What port should the server listen on?
   * @default process.env.PORT || "3000"
   */
  port?: string | number;

  /**
   * Whether the `SO_REUSEPORT` flag should be set.
   * This allows multiple processes to bind to the same port, which is useful for load balancing.
   * @default false
   */
  reusePort?: boolean;

  /**
   * Whether to check for the latest version of the package on startup.
   * If true, the server will attempt to check for updates.
   * @default true
   */
  checkLatestVersion?: boolean;

  /**
   * Whether the `IPV6_V6ONLY` flag should be set.
   * If true, the server will only accept IPv6 connections.
   * @default false
   */
  ipv6Only?: boolean;

  /**
   * What hostname should the server listen on?
   * If not set, listens on all interfaces ("0.0.0.0").
   * @default "0.0.0.0"
   * @example "127.0.0.1" // Only listen locally
   * @example "remix.run" // Only listen on remix.run
   * Note: hostname should not include a port.
   */
  host?: string;

  /**
   * If set, the HTTP server will listen on a unix socket instead of a port.
   * Cannot be used with hostname+port.
   */
  unix?: never;

  /**
   * Sets the number of seconds to wait before timing out a connection due to inactivity.
   * @default 10
   */
  idleTimeout?: number;

  /**
   * Function to register routes and handlers on the router.
   * Receives the OxarionRouter instance.
   */
  httpHandler: (router: OxarionRouter) => void;

  /**
   * Function to safely register middleware on the router.
   * Receives a MiddlewareRegister object with middleware and middlewareChain methods.
   */
  safeMwRegister?: (router: MiddlewareRegister) => void;

  /**
   * Directory where html files are located.
   * If not set, defaults to "pages".
   */
  pagesDir?: string;

  /**
   * Enables debug logging for route matching and requests.
   * If true, logs route matches and timings to the console.
   * @default true
   */
  debugRoutes?: boolean;

  /**
   * If true, caches HTML pages in memory to make them load faster.
   * This will make the HTML static (changes to files won't be reflected until restart).
   * @default true
   */
  cachePages?: boolean;

  /**
   * Function to register WebSocket route handlers.
   * Receives the WSWatcher instance for per-route WebSocket handling.
   */
  wsHandler?: (watcher: WSWatcher) => void;
}

export interface OxarionRouter {
  addHandler: Router["addHandler"];
  injectWrapper: Router["injectWrapper"];
  middleware: Router["middleware"];
  middlewareChain: Router["middlewareChain"];
  switchToWs: Router["switchToWs"];
}

export interface MiddlewareRegister {
  middleware: Router["middleware"];
  middlewareChain: Router["middlewareChain"];
}

export type PageCompression =
  | {
      type: "gzip";
      /**
       * The compression level to use. Must be between `-1` and `9`.
       * - A value of `-1` uses the default compression level (Currently `6`)
       * - A value of `0` gives no compression
       * - A value of `1` gives least compression, fastest speed
       * - A value of `9` gives best compression, slowest speed
       */
      level?: -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
      /**
       * How much memory should be allocated for the internal compression state.
       *
       * A value of `1` uses minimum memory but is slow and reduces compression ratio.
       *
       * A value of `9` uses maximum memory for optimal speed. The default is `8`.
       */
      memLevel?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
      /**
       * The base 2 logarithm of the window size (the size of the history buffer).
       *
       * Larger values of this parameter result in better compression at the expense of memory usage.
       *
       * The following value ranges are supported:
       * - `9..15`: The output will have a zlib header and footer (Deflate)
       * - `-9..-15`: The output will **not** have a zlib header or footer (Raw Deflate)
       * - `25..31` (16+`9..15`): The output will have a gzip header and footer (gzip)
       *
       * The gzip header will have no file name, no extra data, no comment, no modification time (set to zero) and no header CRC.
       */
      windowBits?:
        | -9
        | -10
        | -11
        | -12
        | -13
        | -14
        | -15
        | 9
        | 10
        | 11
        | 12
        | 13
        | 14
        | 15
        | 25
        | 26
        | 27
        | 28
        | 29
        | 30
        | 31;
      /**
       * Tunes the compression algorithm.
       *
       * - `Z_DEFAULT_STRATEGY`: For normal data **(Default)**
       * - `Z_FILTERED`: For data produced by a filter or predictor
       * - `Z_HUFFMAN_ONLY`: Force Huffman encoding only (no string match)
       * - `Z_RLE`: Limit match distances to one (run-length encoding)
       * - `Z_FIXED` prevents the use of dynamic Huffman codes
       *
       * `Z_RLE` is designed to be almost as fast as `Z_HUFFMAN_ONLY`, but give better compression for PNG image data.
       *
       * `Z_FILTERED` forces more Huffman coding and less string matching, it is
       * somewhat intermediate between `Z_DEFAULT_STRATEGY` and `Z_HUFFMAN_ONLY`.
       * Filtered data consists mostly of small values with a somewhat random distribution.
       */
      strategy?: number;
    }
  | {
      type: "zstd";
      level?:
        | 1
        | 2
        | 3
        | 4
        | 5
        | 6
        | 7
        | 8
        | 9
        | 10
        | 11
        | 12
        | 13
        | 14
        | 15
        | 16
        | 17
        | 18
        | 19
        | 20
        | 21
        | 22;
    };

export type MiddlewareFn = (
  req: OxarionRequest<any>,
  res: OxarionResponse,
  next: () => Promise<void>
) => void | Promise<void>;

export type ExtractRouteParams<Path extends string> =
  Path extends `${infer _Start}/[...${infer Catch}]`
    ? { [K in Catch]: string[] | undefined } & ExtractSimpleParams<_Start>
    : ExtractSimpleParams<Path>;

export type ExtractSimpleParams<Path extends string> =
  Path extends `${infer _Start}/[${infer Param}]${infer Rest}`
    ? { [K in Param]: string | undefined } & ExtractSimpleParams<Rest>
    : {};

export type WSHandler = {
  onOpen?: (ws: ServerWebSocket<unknown>) => void;
  onMessage?: (
    ws: ServerWebSocket<unknown>,
    message: string | Uint8Array
  ) => void;
  onClose?: (
    ws: ServerWebSocket<unknown>,
    code: number,
    reason: string
  ) => void;
  onDrain?: (ws: ServerWebSocket<unknown>) => void;
};

export interface WSContext {
  handler?: WSHandler;
}

declare module "bun" {
  interface ServeOptions {
    websocket?: {
      open?: (ws: ServerWebSocket<unknown>) => void;
      message?: (
        ws: ServerWebSocket<unknown>,
        message: string | Uint8Array
      ) => void;
      close?: (
        ws: ServerWebSocket<unknown>,
        code: number,
        reason: string
      ) => void;
      drain?: (ws: ServerWebSocket<unknown>) => void;
    };
  }
}
