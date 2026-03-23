import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireAdmin } from "../lib/auth";
import { uploadToCloudinary } from "../lib/cloudinary";
import { db } from "@workspace/db";
import { productsTable, categoriesTable } from "@workspace/db/schema";
import { ilike } from "drizzle-orm";

const router = Router();

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

async function saveImageBuffer(buffer: Buffer, originalname: string): Promise<string> {
  const cloudinaryConfigured = process.env["CLOUDINARY_CLOUD_NAME"] && process.env["CLOUDINARY_API_KEY"];
  if (cloudinaryConfigured) {
    const { url } = await uploadToCloudinary(buffer);
    return url;
  }
  const ext = path.extname(originalname) || ".jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const filepath = path.join(UPLOADS_DIR, filename);
  fs.writeFileSync(filepath, buffer);
  return `/api/uploads/${filename}`;
}

router.post("/image", requireAdmin, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "Bad Request", message: "No file uploaded" });
      return;
    }
    const url = await saveImageBuffer(req.file.buffer, req.file.originalname);
    const publicId = path.basename(url);
    res.json({ url, publicId });
  } catch (err) {
    req.log.error({ err }, "Upload image error");
    res.status(500).json({ error: "Internal Server Error", message: "Upload failed" });
  }
});

router.post(
  "/bulk",
  requireAdmin,
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "images", maxCount: 100 },
  ]),
  async (req, res) => {
    try {
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      const csvFile = files?.["file"]?.[0];
      const imageFiles = files?.["images"] ?? [];

      if (!csvFile) {
        res.status(400).json({ error: "Bad Request", message: "No CSV file uploaded" });
        return;
      }

      const imageMap: Record<string, Buffer> = {};
      for (const img of imageFiles) {
        imageMap[img.originalname.toLowerCase()] = img.buffer;
      }

      const filename = csvFile.originalname.toLowerCase();
      let rows: Array<Record<string, unknown>> = [];

      if (filename.endsWith(".csv")) {
        const text = csvFile.buffer.toString("utf-8");
        const lines = text.split(/\r?\n/).filter((l) => l.trim());
        if (lines.length < 2) {
          res.status(400).json({ error: "Bad Request", message: "CSV is empty or missing data rows" });
          return;
        }
        const headers = lines[0]!.split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i]!.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
          const row: Record<string, unknown> = {};
          headers.forEach((h, idx) => {
            row[h] = values[idx] ?? "";
          });
          rows.push(row);
        }
      } else {
        const XLSX = await import("xlsx");
        const workbook = XLSX.read(csvFile.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          res.status(400).json({ error: "Bad Request", message: "Empty spreadsheet" });
          return;
        }
        const sheet = workbook.Sheets[sheetName];
        rows = XLSX.utils.sheet_to_json(sheet!) as Array<Record<string, unknown>>;
      }

      const categoriesAll = await db.select().from(categoriesTable);

      function findCategoryId(slug: string): string | undefined {
        if (!slug) return undefined;
        const s = slug.trim().toLowerCase();
        const found = categoriesAll.find(
          (c) =>
            c.slug?.toLowerCase() === s ||
            c.nameEn?.toLowerCase() === s ||
            c.nameAr === slug.trim()
        );
        return found?.id;
      }

      let imported = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const row of rows) {
        try {
          const nameAr = String(row["nameAr"] || row["اسم_عربي"] || row["name_ar"] || "").trim();
          const nameEn = String(row["nameEn"] || row["name_en"] || row["Name"] || "").trim();
          const price = parseFloat(String(row["price"] || row["السعر"] || "0")) || 0;
          const quantity = parseInt(String(row["quantity"] || row["الكمية"] || "0")) || 0;
          const descriptionAr = String(row["descriptionAr"] || row["description_ar"] || row["وصف_عربي"] || "").trim();
          const descriptionEn = String(row["descriptionEn"] || row["description_en"] || row["Description"] || "").trim();
          const salePrice = row["salePrice"] || row["sale_price"] ? parseFloat(String(row["salePrice"] || row["sale_price"])) : undefined;
          const onSale = String(row["onSale"] || row["on_sale"] || "").toLowerCase() === "true";
          const featured = String(row["featured"] || "").toLowerCase() === "true";
          const sku = String(row["sku"] || "").trim() || undefined;
          const categorySlug = String(row["category"] || row["categorySlug"] || "").trim();
          const categoryId = findCategoryId(categorySlug);

          const imageFilenames = String(row["images"] || row["image"] || "")
            .split("|")
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);

          if (!nameAr && !nameEn) {
            errors.push(`Row ${imported + failed + 2}: skipped — missing name`);
            failed++;
            continue;
          }

          const imageUrls: string[] = [];
          for (const imgName of imageFilenames) {
            if (imageMap[imgName]) {
              const url = await saveImageBuffer(imageMap[imgName]!, imgName);
              imageUrls.push(url);
            }
          }

          await db.insert(productsTable).values({
            nameAr: nameAr || nameEn,
            nameEn: nameEn || nameAr,
            descriptionAr: descriptionAr || undefined,
            descriptionEn: descriptionEn || undefined,
            price: String(price),
            salePrice: salePrice != null && !isNaN(salePrice) ? String(salePrice) : undefined,
            quantity,
            sku,
            featured,
            onSale,
            categoryId,
            images: imageUrls,
          });
          imported++;
        } catch (rowErr) {
          failed++;
          errors.push(`Row ${imported + failed + 1}: ${String(rowErr)}`);
        }
      }

      res.json({ imported, failed, errors });
    } catch (err) {
      req.log.error({ err }, "Bulk upload error");
      res.status(500).json({ error: "Internal Server Error", message: "Bulk upload failed" });
    }
  }
);

export default router;
