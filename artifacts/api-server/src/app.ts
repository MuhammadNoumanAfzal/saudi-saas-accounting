import express, { type Express, type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { validateRuntimeEnv } from "./lib/env";
import { rateLimit } from "./middlewares/rateLimit";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";

validateRuntimeEnv();

const isProduction = process.env.NODE_ENV === "production";
const bodyLimit = process.env.REQUEST_BODY_LIMIT ?? "1mb";
const apiRateLimit = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
  max: Number(process.env.RATE_LIMIT_MAX ?? 300),
});

function allowedOrigins(): string[] {
  return [
    process.env.FRONTEND_URL,
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
  ].filter((origin): origin is string => Boolean(origin));
}

function isOriginAllowed(origin: string): boolean {
  if (allowedOrigins().includes(origin)) return true;
  if (!isProduction && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
    return true;
  }
  return false;
}

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin || isOriginAllowed(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("CORS origin denied"));
    },
  }),
);
app.use(express.json({ limit: bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: bodyLimit }));
app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

app.get("/", (_req, res) => {
  res.json({
    name: "KHANBAS NEXUS API Server",
    status: "online",
    frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5176",
    apiPrefix: "/api",
  });
});

app.use("/api", apiRateLimit, router);

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (!req.path.startsWith("/api")) {
    next(err);
    return;
  }

  logger.error({ err, path: req.path }, "Unhandled API error");
  if (res.headersSent) {
    next(err);
    return;
  }

  res.status(500).json({
    error: "Internal Server Error",
    message: isProduction
      ? "Unexpected server error"
      : err instanceof Error
        ? err.message
        : String(err),
  });
});

export default app;