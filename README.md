# OxarionJS 🚀

**OxarionJS** is a powerful, modern backend framework built on top of [Bun](https://bun.sh), designed for speed, simplicity, and full TypeScript support.

---

## ⚡ Why OxarionJS?

- **Ultra Fast**: Built on Bun for maximum performance.
- **TypeScript First**: Enjoy full type safety and modern development experience.
- **Expressive Routing**: Dynamic routes with parameters (`/user/[id]`, `/api/[...path]`).
- **Built-in Middleware**: CORS, JSON, URL-encoded, and more out of the box.
- **WebSocket Support**: Native, per-route WebSocket handlers.
- **Form Data & File Uploads**: Effortless form parsing and file handling.
- **Gzip Compression**: Automatic response compression.
- **Static File Serving**: Serve HTML and static assets with ease.
- **Bun Test Integration**: Write and run tests using Bun's test runner.

---

## 🚀 Getting Started

### 1. Prerequisite: Install Bun

OxarionJS requires [Bun](https://bun.sh) (v1.2.18 or higher).  
If you don't have Bun installed, get it from [https://bun.sh](https://bun.sh).

### 2. Install OxarionJS

```bash
bun add oxarionjs
```

### 3. Create Your First Server

```typescript
import Oxarion, { RoutesWrapper, Middleware } from "oxarionjs";

// Define your routes
const routes = new RoutesWrapper().inject((r) => {
  r.addHandler("GET", "/hello", (_, res) => {
    res.json({ message: "Hello from Oxarion!" });
  });

  r.addHandler("GET", "/user/[id]", (req, res) => {
    const userId = req.getParam("id");
    res.json({ userId, message: "User details" });
  });
});

// Start the server
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

### 4. Run Your Server

```bash
bun run <your-entry-file>.ts
```

Replace `<your-entry-file>.ts` with the name of your main TypeScript file.

---

## 📝 Features Overview

- **Routing**: Dynamic, parameterized, and nested routes.
- **Middleware**: Plug-and-play CORS, JSON, URL-encoded, and custom middleware.
- **WebSocket**: Built-in, per-route WebSocket support.
- **Form Data**: Simple form parsing and file upload handling.
- **Compression**: Automatic gzip compression for responses.
- **Static Files**: Serve static files and HTML pages effortlessly.
- **Testing**: Integrated with Bun's test runner for robust testing.

---

## 📦 Requirements

- **Bun**: v1.2.18 or higher  
  [Install Bun →](https://bun.sh)

---

## 📄 License

[MIT](./LICENSE)

---

> **Need help or want to contribute?**  
> Check out the [issues](https://github.com/VoxlD/OxarionJs/issues) or open a pull request!
