import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "node:path";
import { existsSync } from "node:fs";
import router from "./routes";
import { logger } from "./lib/logger";

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
app.use(cors());
app.use(
  express.json({
    verify(req, _res, buffer) {
      (req as typeof req & { rawBody?: Buffer }).rawBody = Buffer.from(buffer);
    },
  }),
);
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Railway runs the API and the built App Home on one origin. Replit's
// development preview continues to route the two artifacts separately.
if (
  process.env.NODE_ENV === "production" &&
  process.env.RAILWAY_ENVIRONMENT_NAME
) {
  const publicDir = path.resolve(
    process.cwd(),
    "artifacts/delivery-fixes/dist/public",
  );
  const indexFile = path.join(publicDir, "index.html");
  if (!existsSync(indexFile)) {
    throw new Error(`Built Shopify App Home is missing: ${indexFile}`);
  }

  app.use((_req, res, next) => {
    res.set(
      "Content-Security-Policy",
      "frame-ancestors https://admin.shopify.com https://*.myshopify.com",
    );
    next();
  });
  app.use(express.static(publicDir, { index: false }));
  app.get("/{*path}", (req, res) => {
    if (req.path.startsWith("/api/")) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.sendFile(indexFile);
  });
}

export default app;
