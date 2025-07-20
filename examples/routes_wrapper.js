import Oxarion, { RoutesWrapper } from "../dist";

// Define the route
const other_routes = new RoutesWrapper().inject((router) => {
  router.addHandler("GET", "/other-path", (_, res) => {
    res.send("This is other path");
  });
});

Oxarion.start({
  port: 3000,
  httpHandler: (router) => {
    router.addHandler("GET", "/", (_, res) => {
      res.send("Welcome to Oxarion");
    });

    // Inject the route
    router.injectWrapper("/", other_routes);
  },
});
