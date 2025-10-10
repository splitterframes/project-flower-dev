import 'dotenv/config';
import express, { type Request, Response, NextFunction, type RequestHandler } from "express";
import cookieParser from "cookie-parser";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabaseKeepAlive } from "./dbKeepAlive";
import { recordApiPerformance } from "./performanceMonitor";

// 🚀 Phase 3 Optimizations
import { requestCoalescingMiddleware } from "./requestCoalescing";
import { smartCache, cacheInvalidationMiddleware, cacheStatsEndpoint } from "./smartQueryCache";
import { createOptimizedCompression, compressionStatsEndpoint } from "./compressionOptimizer";
import { connectionHealth, healthCheckEndpoint, healthHeadersMiddleware } from "./connectionHealth";
import { getQueryAnalysisEndpoint, analyzeQueryEndpoint } from "./queryAnalyzer";

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const app = express();

const trustProxySetting = process.env.TRUST_PROXY;
if (trustProxySetting && trustProxySetting !== 'false') {
  const value = trustProxySetting === 'true' ? 1 : trustProxySetting;
  app.set('trust proxy', value);
  log(`trust proxy enabled with value: ${value}`);
}

// 🔒 SECURITY: Helmet middleware for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Needed for Vite dev
      styleSrc: ["'self'", "'unsafe-inline'"], // Needed for Tailwind
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:"], // WebSocket support
    },
  },
  crossOriginEmbedderPolicy: false // Disable for dev compatibility
}));

// 🔒 SECURITY: Rate limiting for auth endpoints
const authWindowMs = parsePositiveInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000);
const defaultMax = app.get("env") === "production" ? 5 : 100;
const authMax = parsePositiveInt(process.env.AUTH_RATE_LIMIT_MAX, defaultMax);
const disableAuthRateLimit = process.env.DISABLE_AUTH_RATE_LIMIT === "true";

const baseAuthLimiter = rateLimit({
  windowMs: authWindowMs,
  max: authMax,
  message: { error: "Too many login attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter: RequestHandler = disableAuthRateLimit
  ? (_req, _res, next) => next()
  : baseAuthLimiter;

// 🚀 PERFORMANCE: Optimized compression middleware (Phase 3)
app.use(createOptimizedCompression());

// 🚀 PERFORMANCE: Request coalescing (Phase 3) - Prevents duplicate concurrent requests
app.use(requestCoalescingMiddleware);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser()); // Enable cookie parsing for JWT authentication

// 🚀 PERFORMANCE: Cache invalidation middleware (Phase 3) - Auto-invalidate on mutations
app.use(cacheInvalidationMiddleware);

// 🚀 PERFORMANCE: Health headers (Phase 3) - Add database health info to responses
app.use(healthHeadersMiddleware);

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
      recordApiPerformance(req.method, path, res.statusCode, duration);

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

  // 🚀 Phase 3: Admin & Monitoring Endpoints
  app.get('/api/health', healthCheckEndpoint);
  app.get('/api/admin/cache-stats', cacheStatsEndpoint);
  app.get('/api/admin/compression-stats', compressionStatsEndpoint);
  app.get('/api/admin/query-stats', getQueryAnalysisEndpoint);
  app.post('/api/admin/analyze-query', analyzeQueryEndpoint);

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

  // serve the app on port 5000 (or PORT from env)
  // this serves both the API and the client
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  server.listen(port, "0.0.0.0", () => {
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

    // 🚀 Phase 3: Start connection health monitoring
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_HEALTH_MONITORING === 'true') {
      connectionHealth.startMonitoring(30000); // Check every 30 seconds
      log('🏥 Connection health monitoring started');
    }

    log('✅ All Phase 3 optimizations active: Request Coalescing, Smart Cache, Query Analysis, Health Monitoring');
  });
})();
