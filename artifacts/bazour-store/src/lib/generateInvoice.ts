interface OrderItem {
  productNameAr?: string;
  productNameEn?: string;
  nameAr?: string;
  nameEn?: string;
  productImage?: string;
  quantity: number;
  price: number;
}

interface ShippingAddress {
  name?: string;
  phone?: string;
  city?: string;
  area?: string;
  street?: string;
  building?: string;
  address?: string;
}

interface InvoiceOrder {
  orderNumber?: string;
  createdAt?: string;
  status?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  items?: OrderItem[];
  shippingAddress?: ShippingAddress;
  subtotal?: number | string;
  shippingCost?: number | string;
  discount?: number | string;
  total?: number | string;
  user?: { name?: string; email?: string };
}

interface StoreSettings {
  storeName?: string;
  storeNameAr?: string;
  logoUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  currency?: string;
  currencySymbol?: string;
}

function fmt(val: number | string | undefined): string {
  const n = parseFloat(String(val ?? 0));
  return isNaN(n) ? '0.000' : n.toFixed(3);
}

const statusLabel: Record<string, { ar: string; en: string }> = {
  pending:    { ar: 'قيد الانتظار', en: 'Pending' },
  confirmed:  { ar: 'مؤكد', en: 'Confirmed' },
  processing: { ar: 'قيد المعالجة', en: 'Processing' },
  shipped:    { ar: 'تم الشحن', en: 'Shipped' },
  delivered:  { ar: 'تم التسليم', en: 'Delivered' },
  cancelled:  { ar: 'ملغى', en: 'Cancelled' },
};

const paymentLabel: Record<string, { ar: string; en: string }> = {
  cash_on_delivery: { ar: 'الدفع عند الاستلام', en: 'Cash on Delivery' },
  stripe:           { ar: 'بطاقة ائتمان', en: 'Credit Card' },
  card:             { ar: 'بطاقة ائتمان', en: 'Credit Card' },
};

export function generateInvoice(order: InvoiceOrder, settings?: StoreSettings) {
  const storeName = settings?.storeNameAr || 'بذور';
  const storeNameEn = settings?.storeName || 'Bazour Seeds';
  const logoUrl = settings?.logoUrl || '';
  const contactEmail = settings?.contactEmail || '';
  const contactPhone = settings?.contactPhone || '';
  const currency = 'د.أ';

  const date = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('ar-JO', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '';

  const addr = order.shippingAddress;
  const addrLine = [addr?.name, addr?.street, addr?.area, addr?.city]
    .filter(Boolean).join('، ');

  const items = order.items ?? [];

  const itemsRows = items.map((item, i) => {
    const name = item.productNameAr || item.nameAr || item.productNameEn || item.nameEn || '—';
    const lineTotal = (parseFloat(String(item.price)) * item.quantity);
    return `
      <tr class="${i % 2 === 0 ? 'row-even' : 'row-odd'}">
        <td class="td-center">${i + 1}</td>
        <td>${name}</td>
        <td class="td-center">${item.quantity}</td>
        <td class="td-center">${fmt(item.price)} ${currency}</td>
        <td class="td-center">${fmt(lineTotal)} ${currency}</td>
      </tr>`;
  }).join('');

  const statusAr = statusLabel[order.status || '']?.ar || order.status || '—';
  const paymentAr = paymentLabel[order.paymentMethod || '']?.ar || order.paymentMethod || '—';

  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="logo" style="height:60px;object-fit:contain;" />`
    : `<div class="logo-text">${storeName}</div>`;

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>فاتورة - ${order.orderNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Cairo', Arial, sans-serif;
      background: #f7f8fa;
      color: #1a1a2e;
      direction: rtl;
    }

    .page {
      max-width: 800px;
      margin: 30px auto;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.10);
      overflow: hidden;
    }

    /* Header */
    .header {
      background: linear-gradient(135deg, #1a5c3a 0%, #2d8a56 100%);
      color: #fff;
      padding: 32px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-right {}
    .logo-text {
      font-size: 36px;
      font-weight: 900;
      letter-spacing: -1px;
    }
    .store-name-en {
      font-size: 13px;
      opacity: 0.75;
      margin-top: 4px;
    }
    .header-left {
      text-align: left;
    }
    .invoice-title {
      font-size: 28px;
      font-weight: 700;
    }
    .invoice-number {
      font-size: 13px;
      opacity: 0.8;
      margin-top: 6px;
    }
    .invoice-date {
      font-size: 12px;
      opacity: 0.7;
      margin-top: 2px;
    }

    /* Body */
    .body { padding: 32px 40px; }

    /* Info row */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 28px;
    }
    .info-card {
      background: #f5f7fa;
      border-radius: 10px;
      padding: 18px 20px;
    }
    .info-card-title {
      font-size: 11px;
      font-weight: 700;
      color: #1a5c3a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
      border-bottom: 2px solid #1a5c3a20;
      padding-bottom: 6px;
    }
    .info-card p {
      font-size: 13px;
      line-height: 1.8;
      color: #333;
    }
    .info-card .val {
      font-weight: 600;
    }
    .badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      background: #1a5c3a20;
      color: #1a5c3a;
    }

    /* Items table */
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #1a5c3a;
      margin-bottom: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-bottom: 24px;
    }
    thead tr {
      background: #1a5c3a;
      color: #fff;
    }
    th {
      padding: 10px 14px;
      font-weight: 700;
      text-align: right;
    }
    .td-center { text-align: center; }
    td {
      padding: 10px 14px;
      text-align: right;
    }
    .row-even { background: #f9fafb; }
    .row-odd  { background: #ffffff; }
    tr:not(:last-child) td { border-bottom: 1px solid #eef0f3; }

    /* Totals */
    .totals-wrap {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 28px;
    }
    .totals {
      width: 280px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 7px 0;
      font-size: 13px;
      border-bottom: 1px solid #eef0f3;
    }
    .totals-row.grand {
      font-size: 16px;
      font-weight: 900;
      color: #1a5c3a;
      border-bottom: none;
      border-top: 2px solid #1a5c3a;
      padding-top: 10px;
      margin-top: 4px;
    }
    .totals-row .label { color: #555; }

    /* Footer */
    .footer {
      background: #f5f7fa;
      padding: 20px 40px;
      text-align: center;
      font-size: 12px;
      color: #888;
      border-top: 1px solid #eef0f3;
    }
    .footer a { color: #1a5c3a; text-decoration: none; }

    .thank-you {
      text-align: center;
      font-size: 15px;
      font-weight: 700;
      color: #1a5c3a;
      margin-bottom: 24px;
      padding: 14px;
      background: #1a5c3a10;
      border-radius: 8px;
    }

    @media print {
      body { background: #fff; }
      .page {
        margin: 0;
        box-shadow: none;
        border-radius: 0;
        max-width: 100%;
      }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="header-right">
        ${logoHtml}
        <div class="store-name-en">${storeNameEn}</div>
        ${contactPhone ? `<div class="store-name-en" style="margin-top:2px;">📞 ${contactPhone}</div>` : ''}
        ${contactEmail ? `<div class="store-name-en">${contactEmail}</div>` : ''}
      </div>
      <div class="header-left">
        <div class="invoice-title">فاتورة</div>
        <div class="invoice-number">${order.orderNumber || '—'}</div>
        <div class="invoice-date">${date}</div>
      </div>
    </div>

    <!-- Body -->
    <div class="body">

      <!-- Info grid -->
      <div class="info-grid">
        <div class="info-card">
          <div class="info-card-title">معلومات الزبون</div>
          <p><span class="val">${addr?.name || order.user?.name || '—'}</span></p>
          ${addr?.phone ? `<p>📞 ${addr.phone}</p>` : ''}
          ${addrLine ? `<p>📍 ${addrLine}</p>` : ''}
        </div>
        <div class="info-card">
          <div class="info-card-title">تفاصيل الطلب</div>
          <p>الحالة: <span class="badge">${statusAr}</span></p>
          <p>طريقة الدفع: <span class="val">${paymentAr}</span></p>
          <p>التاريخ: <span class="val">${date}</span></p>
        </div>
      </div>

      <!-- Items -->
      <div class="section-title">المنتجات</div>
      <table>
        <thead>
          <tr>
            <th class="td-center">#</th>
            <th>المنتج</th>
            <th class="td-center">الكمية</th>
            <th class="td-center">السعر</th>
            <th class="td-center">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <!-- Totals -->
      <div class="totals-wrap">
        <div class="totals">
          <div class="totals-row">
            <span class="label">المجموع الجزئي</span>
            <span>${fmt(order.subtotal)} ${currency}</span>
          </div>
          <div class="totals-row">
            <span class="label">الشحن</span>
            <span>${fmt(order.shippingCost)} ${currency}</span>
          </div>
          ${parseFloat(String(order.discount ?? 0)) > 0 ? `
          <div class="totals-row">
            <span class="label">الخصم</span>
            <span style="color:#c0392b;">- ${fmt(order.discount)} ${currency}</span>
          </div>` : ''}
          <div class="totals-row grand">
            <span>الإجمالي الكلي</span>
            <span>${fmt(order.total)} ${currency}</span>
          </div>
        </div>
      </div>

      <!-- Thank you -->
      <div class="thank-you">شكراً لتسوّقكم معنا! 🌱</div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>${storeNameEn} · ${storeName}</p>
      ${contactEmail ? `<p>${contactEmail}</p>` : ''}
    </div>
  </div>

  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) {
    alert('يرجى السماح للمتصفح بفتح نوافذ جديدة لتحميل الفاتورة');
    return;
  }
  win.document.write(html);
  win.document.close();
}
