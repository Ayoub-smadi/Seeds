import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { Resend } from "resend";
import nodemailer from "nodemailer";
import dns from "dns";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/healthz/email", async (_req, res) => {
  const resendKey = process.env["RESEND_API_KEY"];
  const smtpUser = process.env["SMTP_USER"];
  const smtpPass = process.env["SMTP_PASS"];
  const adminEmail =
    process.env["ADMIN_NOTIFICATION_EMAIL"] ||
    process.env["ADMIN_EMAIL"] ||
    smtpUser;
  const fromEmail =
    process.env["SMTP_FROM_EMAIL"] ||
    smtpUser ||
    "onboarding@resend.dev";
  const fromName = process.env["SMTP_FROM_NAME"] || "بذور Seeds Store";
  const from = `"${fromName}" <${fromEmail}>`;

  const envStatus = {
    RESEND_API_KEY: resendKey ? "SET" : "NOT SET",
    SMTP_USER: smtpUser ? "SET" : "NOT SET",
    SMTP_PASS: smtpPass ? "SET" : "NOT SET",
    SMTP_FROM_EMAIL: process.env["SMTP_FROM_EMAIL"] || "NOT SET",
    ADMIN_EMAIL: adminEmail || "NOT SET",
    provider: resendKey ? "resend" : smtpUser ? "smtp" : "none",
  };

  if (!resendKey && (!smtpUser || !smtpPass)) {
    res.status(500).json({
      status: "error",
      message: "No email provider configured. Set RESEND_API_KEY or SMTP_USER + SMTP_PASS.",
      env: envStatus,
    });
    return;
  }

  if (!adminEmail) {
    res.status(500).json({
      status: "error",
      message: "No admin email address configured. Set ADMIN_EMAIL.",
      env: envStatus,
    });
    return;
  }

  // Try Resend first
  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      const result = await resend.emails.send({
        from,
        to: adminEmail,
        subject: "✅ تيست إيميل - بذور Seeds Store",
        html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:24px;">
          <h2 style="color:#2d6a4f;">✅ الإيميل يعمل بنجاح!</h2>
          <p>تم إرسال هذا الإيميل عبر <strong>Resend API</strong> من سيرفر Railway.</p>
          <hr/>
          <p style="color:#888;font-size:12px;">بذور Seeds Store — اختبار تلقائي</p>
        </div>`,
      });

      if (result.error) {
        res.status(500).json({
          status: "error",
          provider: "resend",
          message: result.error.message || "Resend returned an error",
          resend_error: result.error,
          env: envStatus,
        });
        return;
      }

      res.json({
        status: "ok",
        provider: "resend",
        message: `Test email sent via Resend to ${adminEmail}`,
        resend_id: result.data?.id,
        env: envStatus,
      });
      return;
    } catch (err: any) {
      console.error("[HealthCheck] Resend failed:", err.message);
      // Fall through to SMTP if Resend throws
      if (!smtpUser || !smtpPass) {
        res.status(500).json({
          status: "error",
          provider: "resend",
          message: err.message,
          env: envStatus,
        });
        return;
      }
    }
  }

  // Fallback: SMTP
  try {
    const smtpPort = parseInt(process.env["SMTP_PORT"] || "587");
    const smtpSecure = smtpPort === 465;
    const transporter = nodemailer.createTransport({
      host: process.env["SMTP_HOST"] || "smtp.gmail.com",
      port: smtpPort,
      secure: smtpSecure,
      requireTLS: !smtpSecure,
      auth: { user: smtpUser, pass: smtpPass },
      tls: { rejectUnauthorized: false },
      dnsLookup: (address: string, options: any, callback: any) => {
        dns.lookup(address, { ...options, family: 4 }, callback);
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    } as any);

    await transporter.verify();
    await transporter.sendMail({
      from,
      to: adminEmail,
      subject: "✅ تيست إيميل (SMTP) - بذور Seeds Store",
      html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:24px;">
        <h2 style="color:#2d6a4f;">✅ الإيميل يعمل عبر SMTP!</h2>
        <p>تم الإرسال بنجاح من ${process.env["SMTP_HOST"] || "smtp.gmail.com"}</p>
      </div>`,
    });

    res.json({
      status: "ok",
      provider: "smtp",
      message: `Test email sent via SMTP to ${adminEmail}`,
      env: envStatus,
    });
  } catch (err: any) {
    console.error("[HealthCheck] SMTP failed:", err.message, err.code);
    res.status(500).json({
      status: "error",
      provider: "smtp",
      message: err.message,
      code: err.code,
      hint: err.code === "ETIMEDOUT"
        ? "Railway blocks SMTP. Set RESEND_API_KEY to use Resend instead."
        : undefined,
      env: envStatus,
    });
  }
});

export default router;
