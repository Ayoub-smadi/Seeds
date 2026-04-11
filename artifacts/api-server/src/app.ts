import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import fs from "fs";
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

app.use("/api/payments/stripe/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve locally stored uploads; fall back to GCS when the file is missing
app.get("/api/uploads/:filename", async (req, res) => {
  const filename = req.params.filename;
  const localPath = path.resolve(process.cwd(), "uploads", filename);

  // Try local file first
  if (fs.existsSync(localPath)) {
    res.sendFile(localPath);
    return;
  }

  // Fall back to GCS
  const privateObjectDir = process.env["PRIVATE_OBJECT_DIR"];
  if (privateObjectDir) {
    try {
      const { objectStorageClient } = await import("./lib/objectStorage");
      const gcsPath = `${privateObjectDir}/uploads/${filename}`;
      const clean = gcsPath.startsWith("/") ? gcsPath.slice(1) : gcsPath;
      const parts = clean.split("/");
      const bucketName = parts[0]!;
      const objectName = parts.slice(1).join("/");
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      const [exists] = await file.exists();
      if (exists) {
        const [metadata] = await file.getMetadata();
        const contentType = (metadata.contentType as string) || "application/octet-stream";
        res.setHeader("Content-Type", contentType);
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        file.createReadStream().pipe(res);
        return;
      }
    } catch (_err) {
      // fall through to 404
    }
  }

  res.status(404).json({ error: "Not Found" });
});
app.use("/api", router);

const frontendDist = path.resolve(process.cwd(), "artifacts/bazour-store/dist/public");
if (process.env.NODE_ENV === "production" && fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

export default app;
