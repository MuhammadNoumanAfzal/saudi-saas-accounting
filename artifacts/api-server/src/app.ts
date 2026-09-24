import express, { type Express, type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";

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
app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
    frontendUrl: "http://localhost:5173",
    apiPrefix: "/api"
  });
});

app.use("/api", router);

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
    message: err instanceof Error ? err.message : String(err),
  });
});

export default app;
