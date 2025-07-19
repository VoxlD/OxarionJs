import Oxarion, { Middleware } from "../src";

Oxarion.start({
  port: 3000,
  httpHandler: (router) => {
    router.addHandler("GET", "/", (_, res) => {
      res.send("Welcome to Oxarion");
    });
  },
  safeMwRegister: (router) => {
    // You can call .middleware inside of the httpHandler, but if you call mw before register the route, the mw wont apply to route
    router.middleware("/", Middleware.cors()); // This doesn't apply to all routes, only apply to route that statrt with /, so like /api/sum will not apply
    router.middleware("/", Middleware.cors(), true); // This does apply for all routes, so /api/sum will have this mw too
  },
});
