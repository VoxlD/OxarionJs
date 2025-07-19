import type { MiddlewareFn } from "../types";
import type { OxarionRequest } from "../handler/request";
import type { OxarionResponse } from "../handler/response";

function compose_middleware(
  middleware: MiddlewareFn[],
  final_handler: (
    req: OxarionRequest<any>,
    res: OxarionResponse
  ) => Promise<void> | void
): (req: OxarionRequest<any>, res: OxarionResponse) => Promise<void> {
  return async (req, res) => {
    let i = -1;

    const dispatch = async (index: number): Promise<void> => {
      if (index <= i) throw new Error("next() called multiple times");
      i = index;

      const fn =
        index === middleware.length ? final_handler : middleware[index];
      if (!fn) return;
      await fn(req, res, () => dispatch(index + 1));
    };

    await dispatch(0);
  };
}

export { compose_middleware };
