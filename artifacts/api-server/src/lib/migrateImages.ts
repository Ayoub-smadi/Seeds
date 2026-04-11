/**
 * On-startup migration: uploads locally stored images to GCS
 * and updates all database image URL references.
 * Safe to run multiple times (idempotent).
 */
import fs from "fs";
import path from "path";
import { db } from "@workspace/db";
import { productsTable, categoriesTable } from "@workspace/db/schema";
import { sql } from "drizzle-orm";
import { objectStorageClient } from "./objectStorage";
import { logger } from "./logger";

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");
const OLD_PREFIX = "/api/uploads/";
const NEW_PREFIX = "/api/upload/objects/uploads/";

function extToMime(ext: string): string {
  const map: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
  };
  return map[ext.toLowerCase()] ?? "application/octet-stream";
}

function parseObjectPath(gcsPath: string): { bucketName: string; objectName: string } {
  const clean = gcsPath.startsWith("/") ? gcsPath.slice(1) : gcsPath;
  const parts = clean.split("/");
  return { bucketName: parts[0]!, objectName: parts.slice(1).join("/") };
}

export async function migrateLocalImagesToGCS(): Promise<void> {
  const privateObjectDir = process.env["PRIVATE_OBJECT_DIR"];
  if (!privateObjectDir) {
    logger.info("PRIVATE_OBJECT_DIR not set — skipping image migration");
    return;
  }

  if (!fs.existsSync(UPLOADS_DIR)) {
    logger.info("No local uploads directory — skipping image migration");
    return;
  }

  const files = fs.readdirSync(UPLOADS_DIR).filter((f) => !f.startsWith("."));
  if (files.length === 0) {
    logger.info("No local images to migrate");
    return;
  }

  logger.info({ count: files.length }, "Migrating local images to GCS");

  const urlMap: Record<string, string> = {};

  for (const filename of files) {
    const oldUrl = `${OLD_PREFIX}${filename}`;
    const newUrl = `${NEW_PREFIX}${filename}`;
    const ext = path.extname(filename);
    const gcsPath = `${privateObjectDir}/uploads/${filename}`;
    const { bucketName, objectName } = parseObjectPath(gcsPath);

    try {
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      const [exists] = await file.exists();
      if (!exists) {
        const buffer = fs.readFileSync(path.join(UPLOADS_DIR, filename));
        await file.save(buffer, { contentType: extToMime(ext), resumable: false });
        logger.info({ filename }, "Uploaded to GCS");
      }
      urlMap[oldUrl] = newUrl;
    } catch (err) {
      logger.warn({ err, filename }, "Failed to upload image to GCS");
    }
  }

  const entries = Object.entries(urlMap);
  if (entries.length === 0) return;

  logger.info({ count: entries.length }, "Updating database image URLs");

  try {
    // products.images (array)
    const products = await db.execute(
      sql`SELECT id, images FROM products WHERE images IS NOT NULL AND array_length(images, 1) > 0`
    );
    for (const row of products.rows as Array<{ id: string; images: string[] }>) {
      const updated = row.images.map((u) => urlMap[u] ?? u);
      if (updated.some((u, i) => u !== row.images[i])) {
        await db.execute(sql`UPDATE products SET images = ${updated}::text[] WHERE id = ${row.id}`);
        logger.info({ id: row.id }, "Updated product images");
      }
    }
  } catch (err) {
    logger.warn({ err }, "Failed to update product images");
  }

  try {
    // categories.image_url
    for (const [oldUrl, newUrl] of entries) {
      await db.execute(
        sql`UPDATE categories SET image_url = ${newUrl} WHERE image_url = ${oldUrl}`
      );
    }
  } catch (err) {
    logger.warn({ err }, "Failed to update category images");
  }

  try {
    // articles.cover_image + sections
    const articles = await db.execute(
      sql`SELECT id, cover_image, sections FROM articles`
    );
    for (const row of articles.rows as Array<{ id: string; cover_image: string | null; sections: Array<{ imageUrl?: string }> | null }>) {
      let changed = false;
      const cover = row.cover_image ? (urlMap[row.cover_image] ?? row.cover_image) : row.cover_image;
      if (cover !== row.cover_image) changed = true;
      const sections = (row.sections ?? []).map((s) => {
        if (s.imageUrl && urlMap[s.imageUrl]) {
          changed = true;
          return { ...s, imageUrl: urlMap[s.imageUrl] };
        }
        return s;
      });
      if (changed) {
        await db.execute(
          sql`UPDATE articles SET cover_image = ${cover}, sections = ${JSON.stringify(sections)}::jsonb WHERE id = ${row.id}`
        );
      }
    }
  } catch (err) {
    logger.warn({ err }, "Failed to update article images");
  }

  try {
    // settings: logo_url and banner_url columns
    for (const [oldUrl, newUrl] of entries) {
      await db.execute(
        sql`UPDATE settings SET 
          logo_url = CASE WHEN logo_url = ${oldUrl} THEN ${newUrl} ELSE logo_url END,
          banner_url = CASE WHEN banner_url = ${oldUrl} THEN ${newUrl} ELSE banner_url END
        WHERE logo_url = ${oldUrl} OR banner_url = ${oldUrl}`
      );
    }
  } catch (err) {
    logger.warn({ err }, "Failed to update settings images");
  }

  logger.info("Image migration complete");
}
