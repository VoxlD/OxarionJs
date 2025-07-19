# OxarionJS 🚀

A powerful backend framework built on top of BunJS with TypeScript support.

## Installation

### Using Bun (Recommended)

```bash
bun add oxarionjs
```

### Using npm

```bash
npm install oxarionjs
```

### Using yarn

```bash
yarn add oxarionjs
```

## Quick Start

```typescript
import Oxarion, { RoutesWrapper, Middleware } from "oxarionjs";

// Create routes
const routes = new RoutesWrapper().inject((r) => {
  r.addHandler("GET", "/hello", (_, res) => {
    res.json({ message: "Hello from Oxarion!" });
  });

  r.addHandler("GET", "/user/[id]", (req, res) => {
    const userId = req.getParam("id");
    res.json({ userId, message: "User details" });
  });
});

// Start server
Oxarion.start({
  port: 3000,
  debugRoutes: true,

  httpHandler: (router) => {
    router.addHandler("GET", "/", (_, res) => {
      res.json({ message: "Welcome to Oxarion!" });
    });

    router.injectWrapper("/api", routes);
  },

  safeMwRegister: (router) => {
    router.middlewareChain(
      "/",
      [Middleware.cors(), Middleware.json(), Middleware.urlencoded()],
      true
    );
  },
});
```

## Features

- ⚡ **Fast**: Built on BunJS for maximum performance
- 🔧 **TypeScript**: Full TypeScript support with type safety
- 🛣️ **Routing**: Dynamic routes with parameters (`/user/[id]`, `/api/[...path]`)
- 🔌 **Middleware**: Built-in CORS, JSON, and URL-encoded middleware
- 🌐 **WebSocket**: Native WebSocket support with per-route handlers
- 📝 **Form Data**: Easy form data parsing with file upload support
- 🗜️ **Compression**: Built-in gzip compression for responses
- 📁 **Static Files**: Serve static files and HTML pages
- 🧪 **Testing**: Comprehensive test suite with Bun's test runner

## Requirements

- **Bun**: >= 1.0.0
- **Node.js**: >= 18.0.0 (for development)

## License

MIT
