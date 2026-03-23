import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireAdmin } from "../lib/auth";
import { uploadToCloudinary } from "../lib/cloudinary";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db/schema";

const router = Router();

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.post("/image", requireAdmin, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "Bad Request", message: "No file uploaded" });
      return;
    }

    const cloudinaryConfigured = process.env["CLOUDINARY_CLOUD_NAME"] && process.env["CLOUDINARY_API_KEY"];

    if (cloudinaryConfigured) {
      const { url, publicId } = await uploadToCloudinary(req.file.buffer);
      res.json({ url, publicId });
      return;
    }

    const ext = path.extname(req.file.originalname) || ".jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const filepath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(filepath, req.file.buffer);

    const url = `/api/uploads/${filename}`;
    res.json({ url, publicId: filename });
  } catch (err) {
    req.log.error({ err }, "Upload image error");
    res.status(500).json({ error: "Internal Server Error", message: "Upload failed" });
  }
});

router.post("/bulk", requireAdmin, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "Bad Request", message: "No file uploaded" });
      return;
    }

    const filename = req.file.originalname.toLowerCase();
    let rows: Array<Record<string, unknown>> = [];

    if (filename.endsWith(".csv")) {
      const text = req.file.buffer.toString("utf-8");
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) {
        res.status(400).json({ error: "Bad Request", message: "CSV is empty or missing data rows" });
        return;
      }
      const headers = lines[0]!.split(",").map(h => h.trim().replace(/^"|"$/g, ""));
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i]!.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
        const row: Record<string, unknown> = {};
        headers.forEach((h, idx) => { row[h] = values[idx] ?? ""; });
        rows.push(row);
      }
    } else {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        res.status(400).json({ error: "Bad Request", message: "Empty spreadsheet" });
        return;
      }
      const sheet = workbook.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json(sheet!) as Array<Record<string, unknown>>;
    }

    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        const nameAr = String(row["nameAr"] || row["اسم بالعربي"] || "").trim();
        const nameEn = String(row["nameEn"] || row["Name"] || "").trim();
        const price = parseFloat(String(row["price"] || row["السعر"] || "0")) || 0;
        const quantity = parseInt(String(row["quantity"] || row["الكمية"] || "0")) || 0;
        const descriptionAr = String(row["descriptionAr"] || row["وصف"] || "").trim();
        const descriptionEn = String(row["descriptionEn"] || row["Description"] || "").trim();
        const salePrice = row["salePrice"] ? parseFloat(String(row["salePrice"])) : undefined;
        const onSale = String(row["onSale"] || "").toLowerCase() === "true";

        if (!nameAr && !nameEn) {
          errors.push(`Row ${imported + failed + 1} skipped: missing name`);
          failed++;
          continue;
        }

        await db.insert(productsTable).values({
          nameAr: nameAr || nameEn,
          nameEn: nameEn || nameAr,
          descriptionAr,
          descriptionEn,
          price: String(price),
          salePrice: salePrice ? String(salePrice) : undefined,
          quantity,
          images: [],
          onSale,
        });
        imported++;
      } catch (rowErr) {
        failed++;
        errors.push(`Row ${imported + failed} failed: ${String(rowErr)}`);
      }
    }

    res.json({ imported, failed, errors });
  } catch (err) {
    req.log.error({ err }, "Bulk upload error");
    res.status(500).json({ error: "Internal Server Error", message: "Bulk upload failed" });
  }
});

export default router;
