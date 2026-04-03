import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/healthz/email", async (_req, res) => {
  const smtpUser = process.env["SMTP_USER"];
  const smtpPass = process.env["SMTP_PASS"];
  const adminEmail = process.env["ADMIN_EMAIL"] || process.env["SMTP_USER"];

  if (!smtpUser || !smtpPass) {
    res.status(500).json({
      status: "error",
      message: "SMTP_USER or SMTP_PASS not configured",
      env: {
        SMTP_HOST: process.env["SMTP_HOST"] || "NOT SET",
        SMTP_PORT: process.env["SMTP_PORT"] || "NOT SET",
        SMTP_USER: smtpUser ? "SET" : "NOT SET",
        SMTP_PASS: smtpPass ? "SET" : "NOT SET",
        ADMIN_EMAIL: process.env["ADMIN_EMAIL"] || "NOT SET",
        RESEND_API_KEY: process.env["RESEND_API_KEY"] ? "SET" : "NOT SET",
      },
    });
    return;
  }

  try {
    const nodemailer = await import("nodemailer");
    const smtpPort = parseInt(process.env["SMTP_PORT"] || "587");
    const smtpSecure = smtpPort === 465;
    const transporter = nodemailer.default.createTransport({
      host: process.env["SMTP_HOST"] || "smtp.gmail.com",
      port: smtpPort,
      secure: smtpSecure,
      requireTLS: !smtpSecure,
      auth: { user: smtpUser, pass: smtpPass },
      tls: { rejectUnauthorized: false },
      family: 4,
    } as any);

    await transporter.verify();
    await transporter.sendMail({
      from: `"بذور Seeds Store" <${smtpUser}>`,
      to: adminEmail!,
      subject: "✅ تيست إيميل - بذور Seeds Store",
      html: "<h2>الإيميل يعمل بنجاح على Railway ✅</h2><p>تم إرسال هذا الإيميل من السيرفر المباشر.</p>",
    });

    res.json({
      status: "ok",
      message: `Test email sent successfully to ${adminEmail}`,
      env: {
        SMTP_HOST: process.env["SMTP_HOST"] || "smtp.gmail.com",
        SMTP_PORT: process.env["SMTP_PORT"] || "587",
        SMTP_USER: smtpUser,
        ADMIN_EMAIL: adminEmail,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      status: "error",
      message: err.message,
      code: err.code,
      env: {
        SMTP_HOST: process.env["SMTP_HOST"] || "NOT SET",
        SMTP_PORT: process.env["SMTP_PORT"] || "NOT SET",
        SMTP_USER: smtpUser ? "SET" : "NOT SET",
        SMTP_PASS: smtpPass ? "SET" : "NOT SET",
        ADMIN_EMAIL: process.env["ADMIN_EMAIL"] || "NOT SET",
        RESEND_API_KEY: process.env["RESEND_API_KEY"] ? "SET" : "NOT SET",
      },
    });
  }
});

export default router;
