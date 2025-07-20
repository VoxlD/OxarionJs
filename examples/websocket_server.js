import Oxarion from "../dist";

Oxarion.start({
  port: 3000,
  httpHandler: (router) => {
    router.addHandler("GET", "/", (_, res) => {
      res.send("Welcome to Oxarion");
    });

    // Upgrade path to accept WebSocket
    router.switchToWs("/ws");
  },

  wsHandler: (watcher) => {
    // Path watcher to handle incoming data
    watcher.path("/ws", {
      onOpen: (ws) => {
        console.log("Ws Opened");
      },
      onClose: (ws, code, reason) => {
        console.log(`Ws_OnClose: Code: ${code}, Reason: ${reason} `);
      },
      onDrain: (ws) => {
        console.log("Ws_OnDrain");
      },
      onMessage: (ws, message) => {
        console.log(`Ws_OnMessage: ${message.toString()}`);
      },
    });
  },
});
