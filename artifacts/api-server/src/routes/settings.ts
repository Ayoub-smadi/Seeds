import { Router } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db/schema";
import { requireAdmin } from "../lib/auth";
import { invalidateSmtpCache } from "../lib/email";
import nodemailer from "nodemailer";
import dns from "dns";

const router = Router();

const SMTP_PASS_MASK = "__SET__";

function maskSettings(settings: any) {
  return {
    ...settings,
    smtpPass: settings.smtpPass ? SMTP_PASS_MASK : "",
  };
}

async function getOrCreateSettings() {
  const rows = await db.select().from(settingsTable).limit(1);
  if (rows.length === 0) {
    const [settings] = await db.insert(settingsTable).values({
      id: "singleton",
      storeName: "Seeds Store",
      storeNameAr: "بذور",
      currency: "JOD",
      currencySymbol: "د.أ",
    }).returning();
    return settings;
  }
  return rows[0]!;
}

router.get("/", async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json(maskSettings(settings));
  } catch (err) {
    req.log.error({ err }, "Get settings error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/", requireAdmin, async (req, res) => {
  try {
    const updates = { ...req.body };

    if (updates.smtpPass === SMTP_PASS_MASK || updates.smtpPass === "") {
      delete updates.smtpPass;
    }

    const rows = await db.select().from(settingsTable).limit(1);
    if (rows.length === 0) {
      const [settings] = await db.insert(settingsTable).values({ id: "singleton", ...updates }).returning();
      res.json(maskSettings(settings));
      return;
    }

    const [settings] = await db.update(settingsTable)
      .set({ ...updates, updatedAt: new Date() })
      .returning();
    invalidateSmtpCache();
    res.json(maskSettings(settings!));
  } catch (err) {
    req.log.error({ err }, "Update settings error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/test-email", requireAdmin, async (req, res) => {
  try {
    const { toEmail } = req.body as { toEmail?: string };

    const settings = await getOrCreateSettings();

    const smtpHost = settings.smtpHost || process.env["SMTP_HOST"] || "smtp.gmail.com";
    const smtpPort = parseInt(settings.smtpPort || process.env["SMTP_PORT"] || "587");
    const smtpUser = settings.smtpUser || process.env["SMTP_USER"] || "";
    const smtpPass = settings.smtpPass || process.env["SMTP_PASS"] || "";
    const fromName = settings.smtpFromName || process.env["SMTP_FROM_NAME"] || "بذور Seeds Store";
    const fromEmail = settings.smtpFromEmail || process.env["SMTP_FROM_EMAIL"] || smtpUser;

    if (!smtpUser || !smtpPass) {
      res.status(400).json({ error: "SMTP credentials are not configured. Please set SMTP User and Password first." });
      return;
    }

    const recipient = toEmail || smtpUser;
    const smtpSecure = smtpPort === 465;

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      requireTLS: !smtpSecure,
      auth: { user: smtpUser, pass: smtpPass },
      tls: { rejectUnauthorized: false },
      dnsLookup: (address: string, options: any, callback: any) => {
        dns.lookup(address, { ...options, family: 4 }, callback);
      },
    } as any);

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: recipient,
      subject: "✅ اختبار الإيميل — بذور Seeds Store",
      html: `
        <div dir="rtl" style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:24px;background:#f6f9f6;border-radius:12px;">
          <h2 style="color:#2d6a4f;">✅ الإيميل يعمل بشكل صحيح!</h2>
          <p style="color:#555;">هذه رسالة اختبار من لوحة تحكم بذور Seeds Store.</p>
          <p style="color:#888;font-size:13px;">إعدادات الخادم المستخدمة:<br/>
            Host: <strong>${smtpHost}</strong><br/>
            Port: <strong>${smtpPort}</strong><br/>
            User: <strong>${smtpUser}</strong>
          </p>
        </div>
      `,
    });

    res.json({ success: true, message: `Test email sent to ${recipient}` });
  } catch (err: any) {
    req.log.error({ err }, "Test email error");
    res.status(500).json({ error: err?.message || "Failed to send test email" });
  }
});

export default router;
