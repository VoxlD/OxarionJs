import Oxarion from "../dist";

Oxarion.start({
  port: 3000,
  httpHandler: (router) => {
    router.addHandler("GET", "/", (_, res) => {
      res.send("Welcome to Oxarion");
    });
  },
});
