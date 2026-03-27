import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env["SMTP_HOST"] || "smtp.gmail.com",
  port: parseInt(process.env["SMTP_PORT"] || "587"),
  secure: false,
  auth: {
    user: process.env["SMTP_USER"],
    pass: process.env["SMTP_PASS"],
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export interface OrderEmailItem {
  nameAr: string;
  nameEn: string;
  quantity: number;
  price: number;
  productImage?: string;
}

export interface OrderEmailData {
  customerName: string;
  customerEmail?: string;
  orderNumber: string;
  items: OrderEmailItem[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  shippingAddress?: {
    name?: string;
    address?: string;
    city?: string;
    phone?: string;
  };
  paymentMethod?: string;
}

function buildOrderConfirmationHtml(data: OrderEmailData): string {
  const { customerName, orderNumber, items, subtotal, shippingCost, discount, total, shippingAddress, paymentMethod } = data;

  const formatPrice = (amount: number) =>
    `${amount.toFixed(3)} د.أ`;

  const replitDomain = process.env["REPLIT_DEV_DOMAIN"];
  const storeUrl = (
    process.env["STORE_URL"] ||
    (replitDomain ? `https://${replitDomain}` : "")
  ).replace(/\/$/, "");

  const resolveImageUrl = (url?: string): string | undefined => {
    if (!url) return undefined;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (storeUrl && url.startsWith("/")) return `${storeUrl}${url}`;
    return undefined;
  };

  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:16px;border-bottom:1px solid #f0f0f0;vertical-align:middle;">
          <table cellpadding="0" cellspacing="0" border="0" style="width:100%;">
            <tr>
              <td style="width:88px;vertical-align:middle;padding-left:12px;">
                ${resolveImageUrl(item.productImage)
                  ? `<img src="${resolveImageUrl(item.productImage)}" alt="${item.nameAr}" width="80" height="80" style="display:block;width:80px;height:80px;object-fit:cover;border-radius:10px;border:1px solid #e5e5e5;" />`
                  : `<table cellpadding="0" cellspacing="0" border="0"><tr><td width="80" height="80" align="center" valign="middle" style="background:#f0f7f4;border-radius:10px;font-size:28px;border:1px solid #d4edda;">🌱</td></tr></table>`
                }
              </td>
              <td style="vertical-align:middle;padding-right:4px;">
                <div style="font-weight:700;font-size:15px;color:#1a1a1a;margin-bottom:4px;">${item.nameAr}</div>
                <div style="font-size:13px;color:#888;">${item.nameEn}</div>
              </td>
            </tr>
          </table>
        </td>
        <td style="padding:16px;border-bottom:1px solid #f0f0f0;text-align:center;vertical-align:middle;color:#555;font-size:15px;white-space:nowrap;">${item.quantity}</td>
        <td style="padding:16px;border-bottom:1px solid #f0f0f0;text-align:right;vertical-align:middle;color:#555;font-size:14px;white-space:nowrap;">${formatPrice(item.price)}</td>
        <td style="padding:16px;border-bottom:1px solid #f0f0f0;text-align:right;vertical-align:middle;font-weight:700;font-size:15px;color:#2d6a4f;white-space:nowrap;">${formatPrice(item.price * item.quantity)}</td>
      </tr>`
    )
    .join("");

  const paymentLabels: Record<string, string> = {
    cash_on_delivery: "الدفع عند الاستلام",
    stripe: "بطاقة ائتمانية",
  };

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>تأكيد الطلب - بذور</title>
</head>
<body style="margin:0;padding:0;background-color:#f6f9f6;font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;">

  <div style="max-width:640px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#2d6a4f 0%,#40916c 100%);padding:40px 32px;text-align:center;">
      <div style="font-size:36px;margin-bottom:8px;">🌱</div>
      <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">بذور Seeds Store</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">تأكيد الطلب</p>
    </div>

    <!-- Greeting -->
    <div style="padding:32px 32px 0;">
      <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:22px;">مرحباً ${customerName}! 👋</h2>
      <p style="margin:0;color:#555;font-size:15px;line-height:1.6;">
        شكراً لثقتك بمتجر بذور. تم استلام طلبك بنجاح وسيتم معالجته في أقرب وقت ممكن.
      </p>
    </div>

    <!-- Order badge -->
    <div style="padding:24px 32px;">
      <div style="background:#f0f7f4;border:1px solid #d4edda;border-radius:12px;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-size:13px;color:#888;margin-bottom:4px;">رقم الطلب</div>
          <div style="font-size:18px;font-weight:700;color:#2d6a4f;font-family:monospace;">${orderNumber}</div>
        </div>
        <div style="background:#2d6a4f;color:#fff;padding:8px 16px;border-radius:20px;font-size:13px;font-weight:600;">
          ✅ مؤكد
        </div>
      </div>
    </div>

    <!-- Products table -->
    <div style="padding:0 32px;">
      <h3 style="margin:0 0 16px;color:#1a1a1a;font-size:16px;font-weight:700;">المنتجات المطلوبة</h3>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e5e5;border-radius:12px;overflow:hidden;">
        <thead>
          <tr style="background:#f8f8f8;">
            <th style="padding:12px 16px;text-align:right;font-size:13px;color:#666;font-weight:600;border-bottom:2px solid #e5e5e5;">المنتج</th>
            <th style="padding:12px 16px;text-align:center;font-size:13px;color:#666;font-weight:600;border-bottom:2px solid #e5e5e5;">الكمية</th>
            <th style="padding:12px 16px;text-align:right;font-size:13px;color:#666;font-weight:600;border-bottom:2px solid #e5e5e5;">السعر</th>
            <th style="padding:12px 16px;text-align:right;font-size:13px;color:#666;font-weight:600;border-bottom:2px solid #e5e5e5;">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
    </div>

    <!-- Totals -->
    <div style="padding:24px 32px;">
      <div style="background:#fafafa;border:1px solid #e5e5e5;border-radius:12px;padding:20px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
          <span style="color:#555;">المجموع الفرعي</span>
          <span style="color:#1a1a1a;">${formatPrice(subtotal)}</span>
        </div>
        ${shippingCost > 0 ? `
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
          <span style="color:#555;">رسوم الشحن</span>
          <span style="color:#1a1a1a;">${formatPrice(shippingCost)}</span>
        </div>` : ""}
        ${discount > 0 ? `
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
          <span style="color:#555;">الخصم</span>
          <span style="color:#e74c3c;">- ${formatPrice(discount)}</span>
        </div>` : ""}
        <div style="border-top:2px solid #e5e5e5;margin:12px 0;"></div>
        <div style="display:flex;justify-content:space-between;">
          <span style="font-size:17px;font-weight:700;color:#1a1a1a;">المجموع الكلي</span>
          <span style="font-size:20px;font-weight:700;color:#2d6a4f;">${formatPrice(total)}</span>
        </div>
      </div>
    </div>

    <!-- Shipping info -->
    ${shippingAddress ? `
    <div style="padding:0 32px 24px;">
      <h3 style="margin:0 0 16px;color:#1a1a1a;font-size:16px;font-weight:700;">تفاصيل الشحن</h3>
      <div style="background:#fafafa;border:1px solid #e5e5e5;border-radius:12px;padding:20px;line-height:2;">
        ${shippingAddress.name ? `<div><strong>الاسم:</strong> ${shippingAddress.name}</div>` : ""}
        ${shippingAddress.address ? `<div><strong>العنوان:</strong> ${shippingAddress.address}</div>` : ""}
        ${shippingAddress.city ? `<div><strong>المدينة:</strong> ${shippingAddress.city}</div>` : ""}
        ${shippingAddress.phone ? `<div><strong>رقم الهاتف:</strong> ${shippingAddress.phone}</div>` : ""}
        ${paymentMethod ? `<div><strong>طريقة الدفع:</strong> ${paymentLabels[paymentMethod] || paymentMethod}</div>` : ""}
      </div>
    </div>` : ""}

    <!-- Footer -->
    <div style="background:#f8f8f8;border-top:1px solid #e5e5e5;padding:24px 32px;text-align:center;">
      <p style="margin:0 0 8px;color:#555;font-size:14px;">إذا كان لديك أي استفسار، لا تتردد في التواصل معنا</p>
      <p style="margin:0;color:#2d6a4f;font-size:14px;font-weight:600;">seedsstorebazour@gmail.com</p>
      <p style="margin:16px 0 0;color:#aaa;font-size:12px;">© ${new Date().getFullYear()} بذور Seeds Store. جميع الحقوق محفوظة.</p>
    </div>
  </div>

</body>
</html>`;
}

export interface OrderCancelledEmailData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  items: OrderEmailItem[];
}

function buildOrderCancelledHtml(data: OrderCancelledEmailData): string {
  const { customerName, orderNumber, items } = data;

  const replitDomain = process.env["REPLIT_DEV_DOMAIN"];
  const storeUrl = (
    process.env["STORE_URL"] ||
    (replitDomain ? `https://${replitDomain}` : "")
  ).replace(/\/$/, "");

  const resolveImageUrl = (url?: string): string | undefined => {
    if (!url) return undefined;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (storeUrl && url.startsWith("/")) return `${storeUrl}${url}`;
    return undefined;
  };

  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:14px 16px;border-bottom:1px solid #f0f0f0;vertical-align:middle;">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="width:68px;vertical-align:middle;padding-left:12px;">
                ${resolveImageUrl(item.productImage)
                  ? `<img src="${resolveImageUrl(item.productImage)}" alt="${item.nameAr}" width="60" height="60" style="display:block;width:60px;height:60px;object-fit:cover;border-radius:8px;border:1px solid #e5e5e5;opacity:0.7;" />`
                  : `<table cellpadding="0" cellspacing="0" border="0"><tr><td width="60" height="60" align="center" valign="middle" style="background:#f5f5f5;border-radius:8px;font-size:24px;border:1px solid #e0e0e0;">🌱</td></tr></table>`
                }
              </td>
              <td style="vertical-align:middle;padding-right:4px;">
                <div style="font-weight:600;font-size:14px;color:#555;">${item.nameAr}</div>
                <div style="font-size:12px;color:#999;">${item.nameEn}</div>
                <div style="font-size:12px;color:#aaa;margin-top:2px;">الكمية: ${item.quantity}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>إلغاء الطلب - بذور</title>
</head>
<body style="margin:0;padding:0;background-color:#f6f9f6;font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;">

  <div style="max-width:620px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#b91c1c 0%,#dc2626 100%);padding:36px 32px;text-align:center;">
      <div style="font-size:40px;margin-bottom:8px;">😔</div>
      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">بذور Seeds Store</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:15px;">إشعار بإلغاء الطلب</p>
    </div>

    <!-- Greeting -->
    <div style="padding:32px 32px 0;">
      <h2 style="margin:0 0 12px;color:#1a1a1a;font-size:20px;">مرحباً ${customerName}،</h2>
      <p style="margin:0;color:#555;font-size:15px;line-height:1.8;">
        نأسف لإبلاغك بأنه تم <strong>إلغاء طلبك رقم</strong>:
      </p>
    </div>

    <!-- Order badge -->
    <div style="padding:20px 32px;">
      <div style="background:#fff5f5;border:1px solid #fecaca;border-radius:12px;padding:16px 20px;display:inline-block;">
        <div style="font-size:13px;color:#888;margin-bottom:4px;">رقم الطلب</div>
        <div style="font-size:18px;font-weight:700;color:#b91c1c;font-family:monospace;">${orderNumber}</div>
      </div>
    </div>

    <!-- Reason -->
    <div style="padding:0 32px 24px;">
      <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:12px;padding:20px 24px;">
        <div style="font-size:22px;margin-bottom:8px;">📦</div>
        <p style="margin:0;color:#92400e;font-size:15px;font-weight:600;line-height:1.7;">
          سبب الإلغاء: المنتج غير متوفر في المخزون حالياً
        </p>
        <p style="margin:10px 0 0;color:#b45309;font-size:14px;line-height:1.7;">
          نعتذر عن هذا الإزعاج. سيتم إشعارك فور توفر المنتج مجدداً، أو يمكنك تصفح بدائل أخرى في متجرنا.
        </p>
      </div>
    </div>

    <!-- Items -->
    <div style="padding:0 32px 24px;">
      <h3 style="margin:0 0 14px;color:#1a1a1a;font-size:15px;font-weight:700;">المنتجات الملغاة</h3>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e5e5;border-radius:12px;overflow:hidden;">
        <tbody>${itemRows}</tbody>
      </table>
    </div>

    <!-- CTA -->
    <div style="padding:0 32px 32px;text-align:center;">
      <p style="color:#555;font-size:14px;margin-bottom:16px;">هل لديك استفسار؟ تواصل معنا وسنكون سعداء بمساعدتك</p>
      <a href="mailto:${process.env["SMTP_USER"] || "seedsstorebazour@gmail.com"}"
         style="display:inline-block;background:#2d6a4f;color:#ffffff;padding:12px 28px;border-radius:25px;text-decoration:none;font-size:15px;font-weight:600;">
        تواصل معنا
      </a>
    </div>

    <!-- Footer -->
    <div style="background:#f8f8f8;border-top:1px solid #e5e5e5;padding:20px 32px;text-align:center;">
      <p style="margin:0;color:#2d6a4f;font-size:14px;font-weight:600;">${process.env["SMTP_USER"] || "seedsstorebazour@gmail.com"}</p>
      <p style="margin:10px 0 0;color:#aaa;font-size:12px;">© ${new Date().getFullYear()} بذور Seeds Store. جميع الحقوق محفوظة.</p>
    </div>
  </div>

</body>
</html>`;
}

export async function sendOrderCancelledEmail(data: OrderCancelledEmailData): Promise<boolean> {
  if (!process.env["SMTP_USER"] || !process.env["SMTP_PASS"]) {
    return false;
  }

  try {
    const fromName = process.env["SMTP_FROM_NAME"] || "بذور Seeds Store";
    await transporter.sendMail({
      from: `"${fromName}" <${process.env["SMTP_USER"]}>`,
      to: data.customerEmail,
      subject: `❌ إلغاء طلبك #${data.orderNumber} - بذور Seeds Store`,
      html: buildOrderCancelledHtml(data),
    });
    return true;
  } catch (err) {
    console.error("[Email] Failed to send order cancelled email:", err);
    return false;
  }
}

export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<boolean> {
  if (!process.env["SMTP_USER"] || !process.env["SMTP_PASS"]) {
    return false;
  }

  if (!data.customerEmail) {
    return false;
  }

  try {
    const fromName = process.env["SMTP_FROM_NAME"] || "بذور Seeds Store";
    await transporter.sendMail({
      from: `"${fromName}" <${process.env["SMTP_USER"]}>`,
      to: data.customerEmail,
      subject: `✅ تأكيد طلبك #${data.orderNumber} - بذور Seeds Store`,
      html: buildOrderConfirmationHtml(data),
    });
    return true;
  } catch (err) {
    console.error("[Email] Failed to send order confirmation:", err);
    return false;
  }
}
