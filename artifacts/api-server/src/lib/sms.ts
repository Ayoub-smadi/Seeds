import { logger } from "./logger";

async function sendSms(to: string, message: string): Promise<void> {
  const accountSid = process.env["TWILIO_ACCOUNT_SID"];
  const authToken = process.env["TWILIO_AUTH_TOKEN"];
  const fromNumber = process.env["TWILIO_PHONE_NUMBER"];

  if (!accountSid || !authToken || !fromNumber) {
    logger.warn({ to }, "SMS not configured, skipping message");
    return;
  }

  try {
    const { default: twilio } = await import("twilio") as { default: (sid: string, token: string) => { messages: { create: (opts: Record<string, string>) => Promise<unknown> } } };
    const client = twilio(accountSid, authToken);
    await client.messages.create({ to, from: fromNumber, body: message });
    logger.info({ to }, "SMS sent successfully");
  } catch (err) {
    logger.error({ err, to }, "Failed to send SMS");
  }
}

export async function sendOrderConfirmedSms(phone: string, orderNumber: string): Promise<void> {
  const message = `طلبك من متجر بذور تم تأكيده 🌱 رقم الطلب: ${orderNumber}. شكراً لثقتك بنا!`;
  await sendSms(phone, message);
}

export async function sendOrderShippedSms(phone: string, orderNumber: string): Promise<void> {
  const message = `طلبك من متجر بذور تم شحنه 🌱 رقم الطلب: ${orderNumber}. سيصلك قريباً!`;
  await sendSms(phone, message);
}
