import { useState } from "react";
import { useGetOrders, useUpdateOrderStatus } from "@workspace/api-client-react";
import { getGetOrdersQueryKey } from "@workspace/api-client-react";
import { formatPrice } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { useQueryClient } from "@tanstack/react-query";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  processing: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const statuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

export default function OrdersAdmin() {
  const { t, lang } = useTranslation();
  const qc = useQueryClient();
  const { data, isLoading } = useGetOrders({ limit: 100 });
  const updateStatus = useUpdateOrderStatus();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleStatusChange = (id: string, status: string) => {
    updateStatus.mutate({ id, data: { status: status as any } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
        showToast(t('updated_successfully'));
      },
      onError: () => showToast(t('error_generic'), false),
    });
  };

  const orders = data?.orders ?? [];
  const filtered = orders.filter(o =>
    o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
    (o.shippingAddress?.name || o.user?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-white font-medium ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex justify-between items-center bg-card p-6 rounded-3xl border border-border shadow-sm">
        <div>
          <h1 className="text-3xl font-bold font-display">{t('orders')}</h1>
          <p className="text-muted-foreground mt-1">{lang === 'ar' ? `${data?.total ?? 0} طلب` : `${data?.total ?? 0} orders`}</p>
        </div>
      </div>

      <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rtl:left-auto rtl:right-3" />
            <input
              type="text"
              placeholder={t('search_orders')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rtl:pr-9 rtl:pl-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground text-sm border-b border-border">
              <th className="px-6 py-4 font-medium w-8"></th>
              <th className="px-6 py-4 font-medium">{t('order_number')}</th>
              <th className="px-6 py-4 font-medium">{t('customer')}</th>
              <th className="px-6 py-4 font-medium">{t('date')}</th>
              <th className="px-6 py-4 font-medium">{t('total')}</th>
              <th className="px-6 py-4 font-medium">{t('status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</td></tr>
            ) : !filtered.length ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">{t('no_orders')}</td></tr>
            ) : filtered.map((order) => (
              <>
                <tr key={order.id} className="hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}>
                  <td className="px-4 py-4 text-muted-foreground">
                    {expandedId === order.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </td>
                  <td className="px-6 py-4 font-medium font-mono text-sm">{order.orderNumber}</td>
                  <td className="px-6 py-4">
                    <p className="font-medium">{order.shippingAddress?.name || order.user?.name || '—'}</p>
                    {order.shippingAddress?.phone && <p className="text-xs text-muted-foreground">{order.shippingAddress.phone}</p>}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(order.createdAt || "").toLocaleDateString(lang === 'ar' ? 'ar-JO' : 'en-GB')}
                  </td>
                  <td className="px-6 py-4 font-bold text-primary">{formatPrice(order.total, 'JOD', lang)}</td>
                  <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                    <select
                      value={order.status}
                      onChange={e => handleStatusChange(order.id, e.target.value)}
                      className={cn("border rounded-lg px-3 py-1 text-xs font-bold focus:ring-primary focus:border-primary cursor-pointer", statusColors[order.status] || "bg-muted border-border")}
                    >
                      {statuses.map(s => (
                        <option key={s} value={s}>{t(s as any)}</option>
                      ))}
                    </select>
                  </td>
                </tr>
                {expandedId === order.id && (
                  <tr key={`${order.id}-detail`} className="bg-muted/10">
                    <td colSpan={6} className="px-8 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div>
                          <p className="font-bold mb-2">{lang === 'ar' ? 'عنوان الشحن' : 'Shipping Address'}</p>
                          <div className="space-y-1 text-muted-foreground">
                            <p>{order.shippingAddress?.name}</p>
                            <p>{order.shippingAddress?.address}</p>
                            <p>{order.shippingAddress?.city}</p>
                            <p>{order.shippingAddress?.phone}</p>
                          </div>
                        </div>
                        <div>
                          <p className="font-bold mb-2">{lang === 'ar' ? 'المنتجات' : 'Items'}</p>
                          <div className="space-y-1">
                            {(order.items as any[])?.map((item: any, i: number) => (
                              <div key={i} className="flex justify-between text-muted-foreground">
                                <span>{lang === 'ar' ? item.nameAr : item.nameEn} × {item.quantity}</span>
                                <span className="font-medium text-foreground">{formatPrice(item.price * item.quantity, 'JOD', lang)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
