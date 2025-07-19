import Oxarion from "oxarionjs";

Oxarion.start({
  port: 3000,
  httpHandler: (router) => {
    router.addHanlder("GET", "/", (_, res) => {
      res.send("Welcome to Oxarion");
    });
  },
});
