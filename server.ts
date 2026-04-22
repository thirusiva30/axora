import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import apiRouter from "./server/api.js";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Request Logger
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // API routes
  app.use("/api", apiRouter);

  // Global Error Handler
  app.use((err, req, res, next) => {
    console.error('[SERVER ERROR]', err);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: err.message, 
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Axora server running on http://localhost:${PORT}`);
  });
}

startServer();
