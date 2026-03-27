import { Package, ShoppingCart, Users, TrendingUp, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useGetProducts, useGetOrders, useGetUsers, useGetCategories } from "@workspace/api-client-react";
import { useTranslation } from "@/lib/i18n";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";

const PIE_COLORS = ["#f97316", "#3b82f6", "#8b5cf6", "#10b981", "#ec4899"];

const RADIAN = Math.PI / 180;
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.05) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      style={{ fontSize: 12, fontWeight: 700 }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

function CategoryPieChart() {
  const { data: cats } = useGetCategories();
  const { lang } = useTranslation();
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const mainCat = cats?.find(c => c.slug === "budhour-ziraiya");
  const subs = (mainCat as any)?.subcategories ?? [];
  if (!subs.length) return null;

  const pieData = subs
    .filter((c: any) => c.productCount > 0)
    .map((c: any) => ({
      name: lang === "ar" ? c.nameAr : c.nameEn,
      value: c.productCount,
    }));

  const total = pieData.reduce((s: number, d: any) => s + d.value, 0);

  return (
    <div className="bg-card rounded-3xl border border-border shadow-sm p-6">
      <h2 className="text-xl font-bold mb-1">🌱 توزيع منتجات بذور زراعية</h2>
      <p className="text-muted-foreground text-sm mb-4">إجمالي {total} منتج</p>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="w-full md:w-56 h-56 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
                labelLine={false}
                label={PieLabel}
                stroke="none"
                onMouseEnter={(_, i) => setActiveIdx(i)}
                onMouseLeave={() => setActiveIdx(null)}
              >
                {pieData.map((_: any, i: number) => (
                  <Cell
                    key={i}
                    fill={PIE_COLORS[i % PIE_COLORS.length]}
                    opacity={activeIdx === null || activeIdx === i ? 1 : 0.4}
                    style={{ cursor: "pointer", transition: "opacity 0.2s" }}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: any, n: any) => [`${v} منتج`, n]}
                contentStyle={{ borderRadius: 12, fontSize: 13, direction: "rtl" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          {pieData.map((entry: any, i: number) => (
            <div
              key={i}
              onMouseEnter={() => setActiveIdx(i)}
              onMouseLeave={() => setActiveIdx(null)}
              className="flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-default"
              style={{
                borderColor: activeIdx === i ? PIE_COLORS[i % PIE_COLORS.length] + "88" : "var(--border)",
                background: activeIdx === i ? PIE_COLORS[i % PIE_COLORS.length] + "11" : "transparent",
              }}
            >
              <span className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: PIE_COLORS[i % PIE_COLORS.length],
                  boxShadow: `0 0 6px ${PIE_COLORS[i % PIE_COLORS.length]}88` }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{entry.name}</p>
                <p className="text-xs text-muted-foreground">{entry.value} منتج</p>
              </div>
              <span className="text-sm font-bold" style={{ color: PIE_COLORS[i % PIE_COLORS.length] }}>
                {((entry.value / total) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  processing: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function AdminDashboard() {
  const { t, lang } = useTranslation();
  const { data: productsData } = useGetProducts({ limit: 1 });
  const { data: ordersData } = useGetOrders({ limit: 5 });
  const { data: usersData } = useGetUsers();

  const totalRevenue = ordersData?.orders.reduce((sum, o) => sum + (o.total || 0), 0) ?? 0;

  const stats = [
    {
      label: t('total_products'),
      value: productsData?.total ?? 0,
      icon: Package,
      color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      href: "/admin/products",
    },
    {
      label: t('total_orders'),
      value: ordersData?.total ?? 0,
      icon: ShoppingCart,
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      href: "/admin/orders",
    },
    {
      label: t('total_users'),
      value: usersData?.length ?? 0,
      icon: Users,
      color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      href: "/admin/users",
    },
    {
      label: t('total_revenue'),
      value: formatPrice(totalRevenue, 'JOD', lang),
      icon: TrendingUp,
      color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      href: "/admin/orders",
      isPrice: true,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
        <h1 className="text-3xl font-bold font-display">{t('dashboard')}</h1>
        <p className="text-muted-foreground mt-1">{t('quick_stats')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <div className="bg-card p-6 rounded-3xl border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4", stat.color)}>
                <stat.icon className="w-6 h-6" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">{stat.label}</p>
              <p className="text-3xl font-bold mt-1 group-hover:text-primary transition-colors">
                {stat.isPrice ? stat.value : stat.value.toLocaleString()}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <CategoryPieChart />

      <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold">{t('recent_orders')}</h2>
          <Link href="/admin/orders" className="flex items-center gap-1 text-sm text-primary hover:underline font-medium">
            {t('orders')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-muted/40 text-muted-foreground text-sm">
              <th className="px-6 py-3 font-medium">{t('order_number')}</th>
              <th className="px-6 py-3 font-medium">{t('customer')}</th>
              <th className="px-6 py-3 font-medium">{t('total')}</th>
              <th className="px-6 py-3 font-medium">{t('status')}</th>
              <th className="px-6 py-3 font-medium">{t('date')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {!ordersData?.orders.length ? (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">{t('no_orders')}</td></tr>
            ) : ordersData?.orders.slice(0, 5).map((order) => (
              <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-6 py-4 font-mono text-sm font-medium">{order.orderNumber}</td>
                <td className="px-6 py-4">{order.shippingAddress?.name || order.user?.name || '—'}</td>
                <td className="px-6 py-4 font-bold text-primary">{formatPrice(order.total, 'JOD', lang)}</td>
                <td className="px-6 py-4">
                  <span className={cn("px-2 py-1 rounded-md text-xs font-bold", statusColors[order.status] || "bg-muted text-muted-foreground")}>
                    {t(order.status as keyof ReturnType<typeof useTranslation>['t'] extends (k: infer K) => string ? K : never)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {new Date(order.createdAt || "").toLocaleDateString(lang === 'ar' ? 'ar-JO' : 'en-GB')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
