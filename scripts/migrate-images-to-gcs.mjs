/**
 * Migrate locally stored images from /uploads/ to Google Cloud Storage
 * and update all database references accordingly.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Storage } from "@google-cloud/storage";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, "../artifacts/api-server/uploads");
const REPLIT_SIDECAR = "http://127.0.0.1:1106";
const PRIVATE_OBJECT_DIR = process.env.PRIVATE_OBJECT_DIR;
const DATABASE_URL = process.env.DATABASE_URL;

if (!PRIVATE_OBJECT_DIR) throw new Error("PRIVATE_OBJECT_DIR env var is not set");
if (!DATABASE_URL) throw new Error("DATABASE_URL env var is not set");

// ----- GCS client (Replit sidecar auth) -----
const storage = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR}/credential`,
      format: { type: "json", subject_token_field_name: "access_token" },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

function parseObjectPath(gcsPath) {
  const clean = gcsPath.startsWith("/") ? gcsPath.slice(1) : gcsPath;
  const parts = clean.split("/");
  return { bucketName: parts[0], objectName: parts.slice(1).join("/") };
}

function extToMime(ext) {
  const map = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif" };
  return map[ext.toLowerCase()] || "application/octet-stream";
}

async function uploadToGCS(localPath, filename) {
  const ext = path.extname(filename);
  const gcsPath = `${PRIVATE_OBJECT_DIR}/uploads/${filename}`;
  const { bucketName, objectName } = parseObjectPath(gcsPath);
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(objectName);
  const buffer = fs.readFileSync(localPath);
  await file.save(buffer, { contentType: extToMime(ext), resumable: false });
  return `/api/upload/objects/uploads/${filename}`;
}

// ----- DB -----
const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();

// Load all local files
const files = fs.existsSync(UPLOADS_DIR) ? fs.readdirSync(UPLOADS_DIR) : [];
console.log(`Found ${files.length} local images to migrate\n`);

if (files.length === 0) {
  console.log("No local images found. Nothing to migrate.");
  await client.end();
  process.exit(0);
}

// Build old→new URL map
const urlMap = {};
let uploaded = 0, failed = 0;

for (const filename of files) {
  const oldUrl = `/api/uploads/${filename}`;
  const localPath = path.join(UPLOADS_DIR, filename);
  try {
    process.stdout.write(`  Uploading ${filename}... `);
    const newUrl = await uploadToGCS(localPath, filename);
    urlMap[oldUrl] = newUrl;
    console.log(`✓`);
    uploaded++;
  } catch (err) {
    console.log(`✗ ${err.message}`);
    failed++;
  }
}

console.log(`\nUploaded: ${uploaded}, Failed: ${failed}\n`);
console.log("Updating database references...\n");

let dbUpdates = 0;

// 1) products.images (array of URLs)
const products = await client.query("SELECT id, images FROM products WHERE images IS NOT NULL");
for (const row of products.rows) {
  const imgs = row.images || [];
  const updated = imgs.map(url => urlMap[url] || url);
  const changed = updated.some((u, i) => u !== imgs[i]);
  if (changed) {
    await client.query("UPDATE products SET images = $1 WHERE id = $2", [JSON.stringify(updated), row.id]);
    dbUpdates++;
    console.log(`  Updated product ${row.id}: ${imgs.length} image(s)`);
  }
}

// 2) categories.image_url
const cats = await client.query("SELECT id, image_url FROM categories WHERE image_url LIKE '/api/uploads/%'");
for (const row of cats.rows) {
  const newUrl = urlMap[row.image_url];
  if (newUrl) {
    await client.query("UPDATE categories SET image_url = $1 WHERE id = $2", [newUrl, row.id]);
    dbUpdates++;
    console.log(`  Updated category ${row.id}`);
  }
}

// 3) articles.cover_image
const articles = await client.query("SELECT id, cover_image, sections FROM articles WHERE cover_image LIKE '/api/uploads/%' OR sections::text LIKE '%/api/uploads/%'");
for (const row of articles.rows) {
  let changed = false;
  const newCover = row.cover_image && urlMap[row.cover_image] ? urlMap[row.cover_image] : row.cover_image;
  if (newCover !== row.cover_image) changed = true;

  let sections = row.sections || [];
  sections = sections.map(s => {
    if (s.imageUrl && urlMap[s.imageUrl]) {
      changed = true;
      return { ...s, imageUrl: urlMap[s.imageUrl] };
    }
    return s;
  });

  if (changed) {
    await client.query("UPDATE articles SET cover_image = $1, sections = $2 WHERE id = $3", [newCover, JSON.stringify(sections), row.id]);
    dbUpdates++;
    console.log(`  Updated article ${row.id}`);
  }
}

// 4) users.avatar
const users = await client.query("SELECT id, avatar FROM users WHERE avatar LIKE '/api/uploads/%'");
for (const row of users.rows) {
  const newUrl = urlMap[row.avatar];
  if (newUrl) {
    await client.query("UPDATE users SET avatar = $1 WHERE id = $2", [newUrl, row.id]);
    dbUpdates++;
    console.log(`  Updated user avatar ${row.id}`);
  }
}

// 5) settings (carousel slides, store logo, etc.)
const settings = await client.query("SELECT id, key, value FROM settings WHERE value::text LIKE '%/api/uploads/%'");
for (const row of settings.rows) {
  let val = row.value;
  let changed = false;
  const text = JSON.stringify(val);
  let newText = text;
  for (const [oldUrl, newUrl] of Object.entries(urlMap)) {
    if (newText.includes(oldUrl)) {
      newText = newText.replaceAll(oldUrl, newUrl);
      changed = true;
    }
  }
  if (changed) {
    await client.query("UPDATE settings SET value = $1 WHERE id = $2", [newText, row.id]);
    dbUpdates++;
    console.log(`  Updated setting ${row.key}`);
  }
}

await client.end();

console.log(`\n✅ Migration complete!`);
console.log(`   ${uploaded} images uploaded to GCS`);
console.log(`   ${dbUpdates} database records updated`);
if (failed > 0) console.log(`   ⚠️  ${failed} images failed to upload`);
