import { logger } from "./logger";

const isProduction = process.env.NODE_ENV === "production";

const requiredEnv = [
  "DATABASE_URL",
  "CLERK_SECRET_KEY",
  "CLERK_PUBLISHABLE_KEY",
  "FRONTEND_URL",
] as const;

function hasValue(name: string): boolean {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0;
}

export function validateRuntimeEnv(): void {
  const missing = requiredEnv.filter((name) => !hasValue(name));
  const warnings: string[] = [];

  if (process.env.DATABASE_URL?.includes("[YOUR-PASSWORD]")) {
    missing.push("DATABASE_URL");
  }

  if (isProduction && process.env.CLERK_SECRET_KEY?.startsWith("sk_test_")) {
    warnings.push("CLERK_SECRET_KEY is a test key in production");
  }

  if (isProduction && (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN)) {
    warnings.push("UPSTASH_REDIS_REST_URL/TOKEN not set; API rate limits will be per-instance");
  }

  if (isProduction && !process.env.SENTRY_DSN && !process.env.AXIOM_TOKEN && !process.env.DATADOG_API_KEY) {
    warnings.push("No external error monitoring/log drain env configured");
  }

  if (process.env.ZATCA_ENV === "production") {
    for (const name of ["ZATCA_CSR_BASE64", "ZATCA_PRIVATE_KEY_PEM"] as const) {
      if (!hasValue(name)) missing.push(name);
    }
  }

  for (const warning of warnings) {
    logger.warn({ warning }, "Runtime environment warning");
  }

  if (missing.length === 0) return;

  const uniqueMissing = Array.from(new Set(missing));
  const message = `Missing required environment variables: ${uniqueMissing.join(", ")}`;

  if (isProduction) {
    throw new Error(message);
  }

  logger.warn({ missing: uniqueMissing }, message);
}