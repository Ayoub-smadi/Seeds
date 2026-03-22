import { Router } from "express";
import multer from "multer";
import { requireAdmin } from "../lib/auth";
import { uploadToCloudinary } from "../lib/cloudinary";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db/schema";

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.post("/image", requireAdmin, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "Bad Request", message: "No file uploaded" });
      return;
    }

    const cloudinaryConfigured = process.env["CLOUDINARY_CLOUD_NAME"] && process.env["CLOUDINARY_API_KEY"];

    if (!cloudinaryConfigured) {
      const base64 = req.file.buffer.toString("base64");
      const mimeType = req.file.mimetype;
      const dataUrl = `data:${mimeType};base64,${base64}`;
      res.json({ url: dataUrl, publicId: "local-" + Date.now() });
      return;
    }

    const { url, publicId } = await uploadToCloudinary(req.file.buffer);
    res.json({ url, publicId });
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

    const XLSX = await import("xlsx");
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      res.status(400).json({ error: "Bad Request", message: "Empty spreadsheet" });
      return;
    }
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet!) as Array<Record<string, unknown>>;

    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        const nameAr = String(row["nameAr"] || row["اسم بالعربي"] || "");
        const nameEn = String(row["nameEn"] || row["Name"] || "");
        const price = parseFloat(String(row["price"] || row["السعر"] || "0"));
        const quantity = parseInt(String(row["quantity"] || row["الكمية"] || "0"));
        const descriptionAr = String(row["descriptionAr"] || row["وصف"] || "");
        const descriptionEn = String(row["descriptionEn"] || row["Description"] || "");

        if (!nameAr && !nameEn) {
          errors.push(`Row skipped: missing name`);
          failed++;
          continue;
        }

        await db.insert(productsTable).values({
          nameAr: nameAr || nameEn,
          nameEn: nameEn || nameAr,
          descriptionAr,
          descriptionEn,
          price: String(price),
          quantity,
          images: [],
        });
        imported++;
      } catch (rowErr) {
        failed++;
        errors.push(`Row failed: ${String(rowErr)}`);
      }
    }

    res.json({ imported, failed, errors });
  } catch (err) {
    req.log.error({ err }, "Bulk upload error");
    res.status(500).json({ error: "Internal Server Error", message: "Bulk upload failed" });
  }
});

export default router;
