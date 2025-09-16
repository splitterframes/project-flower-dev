import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabaseKeepAlive } from "./dbKeepAlive";

const app = express();

// Performance middleware - Enhanced compression
app.use(compression({
  level: 6,           // Good compression vs CPU balance
  threshold: 1024,    // Compress responses > 1KB
  filter: (req, res) => {
    // Don't compress small responses or images
    if (res.getHeader('Content-Type')?.includes('image/')) return false;
    return compression.filter(req, res);
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser()); // Enable cookie parsing for JWT authentication

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      // Only log full response in development - saves significant CPU in production
      if (process.env.NODE_ENV === 'development' && capturedJsonResponse && duration > 50) {
        const responseStr = JSON.stringify(capturedJsonResponse);
        logLine += ` :: ${responseStr.slice(0, 30)}${responseStr.length > 30 ? '…' : ''}`;
      } else if (duration > 300) {
        // Only log very slow requests 
        logLine += ' [VERY-SLOW]';
      } else if (duration > 150) {
        logLine += ' [SLOW]';
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // serve the app on port 3000 (or PORT from env)
  // this serves both the API and the client
  const port = process.env.PORT ? parseInt(process.env.PORT) : 7893;
  server.listen(port, "localhost", () => {
    log(`serving on port ${port}`);
    
    // Initialize database keep-alive system
    initializeDatabaseKeepAlive();
    
    // Start butterfly spawning system
    import('./butterflySpawner').then(({ butterflySpawner }) => {
      butterflySpawner.start();
      log('🦋 Butterfly spawning system initialized');
    });

    // Start sun spawning system
    import('./sunSpawner').then(({ sunSpawner }) => {
      sunSpawner.start();
      log('☀️ Sun spawning system initialized');
    });

    // Start passive income processing system
    import('./passiveIncomeProcessor').then(({ passiveIncomeProcessor }) => {
      passiveIncomeProcessor.start();
      log('💰 Passive income processing system initialized');
    });

    // Start weekly challenge management system
    import('./challengeManager').then(({ challengeManager }) => {
      challengeManager.start();
    });

  });
})();
