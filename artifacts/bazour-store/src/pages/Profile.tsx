import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useGetCurrentUser, useGetOrders, useUpdateUser } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetCurrentUserQueryKey, getGetOrdersQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { formatPrice } from "@/lib/utils";
import { User, Package, Camera, LogOut, Edit2, Check, X } from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

type Tab = "profile" | "orders";

export default function Profile() {
  const { t, lang } = useTranslation();
  const [_, setLocation] = useLocation();
  const qc = useQueryClient();

  const { data: user, isLoading: userLoading } = useGetCurrentUser();
  const { data: ordersData, isLoading: ordersLoading } = useGetOrders();
  const updateMut = useUpdateUser();

  const [tab, setTab] = useState<Tab>("profile");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const avatarRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem("bazour_token");
    setLocation("/");
    window.location.reload();
  };

  const startEdit = () => {
    setForm({ name: user?.name || "", phone: user?.phone || "" });
    setEditing(true);
  };

  const handleSaveProfile = () => {
    if (!user) return;
    updateMut.mutate(
      { id: user.id, data: { name: form.name, phone: form.phone } as any },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          setEditing(false);
          showToast(lang === "ar" ? "تم حفظ المعلومات" : "Profile saved");
        },
        onError: () => showToast(lang === "ar" ? "حدث خطأ" : "Error saving", false),
      }
    );
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarUploading(true);
    try {
      const token = localStorage.getItem("bazour_token");
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await fetch(`${BASE}/api/upload/image`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url } = await uploadRes.json();

      updateMut.mutate(
        { id: user.id, data: { avatarUrl: url } as any },
        {
          onSuccess: () => {
            qc.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
            showToast(lang === "ar" ? "تم تحديث الصورة" : "Avatar updated");
          },
          onError: () => showToast(lang === "ar" ? "فشل حفظ الصورة" : "Failed to save avatar", false),
        }
      );
    } catch {
      showToast(lang === "ar" ? "فشل رفع الصورة" : "Upload failed", false);
    } finally {
      setAvatarUploading(false);
      if (avatarRef.current) avatarRef.current.value = "";
    }
  };

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    processing: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
    delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  const statusLabel: Record<string, { ar: string; en: string }> = {
    pending: { ar: "قيد الانتظار", en: "Pending" },
    confirmed: { ar: "مؤكد", en: "Confirmed" },
    processing: { ar: "جاري التجهيز", en: "Processing" },
    shipped: { ar: "تم الشحن", en: "Shipped" },
    delivered: { ar: "تم التسليم", en: "Delivered" },
    cancelled: { ar: "ملغي", en: "Cancelled" },
  };

  if (userLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <User className="w-16 h-16 text-muted-foreground/30" />
        <h2 className="text-2xl font-bold">
          {lang === "ar" ? "يجب تسجيل الدخول أولاً" : "Please sign in first"}
        </h2>
        <Button onClick={() => setLocation("/auth/login")} className="rounded-xl">
          {t("sign_in")}
        </Button>
      </div>
    );
  }

  const orders = ordersData?.orders ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-white font-medium transition-all ${
            toast.ok ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Header card */}
      <div className="bg-card rounded-3xl border border-border shadow-sm p-6 flex items-center gap-6">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-muted border-4 border-primary/20 flex items-center justify-center">
            {(user as any).avatarUrl ? (
              <img
                src={(user as any).avatarUrl}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-muted-foreground/40" />
            )}
          </div>
          <button
            onClick={() => avatarRef.current?.click()}
            disabled={avatarUploading}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
            title={lang === "ar" ? "تغيير الصورة" : "Change photo"}
          >
            {avatarUploading ? (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Camera className="w-3.5 h-3.5" />
            )}
          </button>
          <input
            ref={avatarRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">{user.name}</h1>
          <p className="text-muted-foreground text-sm truncate">{user.email}</p>
          <span
            className={`inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-full ${
              user.role === "admin"
                ? "bg-primary/15 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {user.role === "admin"
              ? lang === "ar"
                ? "مدير"
                : "Admin"
              : lang === "ar"
              ? "عميل"
              : "Customer"}
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive rounded-xl gap-1 flex-shrink-0"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">{lang === "ar" ? "تسجيل الخروج" : "Logout"}</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-muted/40 p-1 rounded-2xl w-fit">
        {(["profile", "orders"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === t
                ? "bg-card shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "profile" ? (
              <>
                <User className="w-4 h-4" />
                {lang === "ar" ? "معلوماتي" : "My Info"}
              </>
            ) : (
              <>
                <Package className="w-4 h-4" />
                {lang === "ar" ? "طلباتي" : "My Orders"}
                {orders.length > 0 && (
                  <span className="bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {orders.length}
                  </span>
                )}
              </>
            )}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === "profile" && (
        <div className="bg-card rounded-3xl border border-border shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">
              {lang === "ar" ? "المعلومات الشخصية" : "Personal Information"}
            </h2>
            {!editing ? (
              <Button variant="outline" size="sm" className="rounded-xl gap-1" onClick={startEdit}>
                <Edit2 className="w-3.5 h-3.5" />
                {lang === "ar" ? "تعديل" : "Edit"}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="rounded-xl gap-1"
                  onClick={handleSaveProfile}
                  disabled={updateMut.isPending}
                >
                  <Check className="w-3.5 h-3.5" />
                  {lang === "ar" ? "حفظ" : "Save"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-1"
                  onClick={() => setEditing(false)}
                >
                  <X className="w-3.5 h-3.5" />
                  {lang === "ar" ? "إلغاء" : "Cancel"}
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { label: lang === "ar" ? "الاسم" : "Name", key: "name", value: user.name, editable: true },
              { label: lang === "ar" ? "البريد الإلكتروني" : "Email", key: "email", value: user.email, editable: false },
              { label: lang === "ar" ? "رقم الهاتف" : "Phone", key: "phone", value: user.phone || "—", editable: true },
              {
                label: lang === "ar" ? "تاريخ الانضمام" : "Member since",
                key: "createdAt",
                value: new Date(user.createdAt!).toLocaleDateString(lang === "ar" ? "ar-JO" : "en-GB", {
                  year: "numeric", month: "long", day: "numeric",
                }),
                editable: false,
              },
            ].map(({ label, key, value, editable }) => (
              <div key={key} className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {label}
                </label>
                {editing && editable && (key === "name" || key === "phone") ? (
                  <input
                    value={form[key as "name" | "phone"]}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [key]: e.target.value }))
                    }
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
                    dir={lang === "ar" ? "rtl" : "ltr"}
                  />
                ) : (
                  <p className="text-base font-medium">{value}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders tab */}
      {tab === "orders" && (
        <div className="space-y-4">
          {ordersLoading ? (
            <div className="bg-card rounded-3xl border border-border p-8 text-center text-muted-foreground">
              {lang === "ar" ? "جاري التحميل..." : "Loading..."}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-card rounded-3xl border border-border p-12 text-center space-y-3">
              <Package className="w-14 h-14 text-muted-foreground/20 mx-auto" />
              <p className="text-muted-foreground font-medium">
                {lang === "ar" ? "لا توجد طلبات بعد" : "No orders yet"}
              </p>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setLocation("/products")}
              >
                {lang === "ar" ? "تصفح المنتجات" : "Browse Products"}
              </Button>
            </div>
          ) : (
            orders.map((order: any) => (
              <div
                key={order.id}
                className="bg-card rounded-3xl border border-border shadow-sm p-5 space-y-4"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-bold text-base">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString(
                        lang === "ar" ? "ar-JO" : "en-GB",
                        { year: "numeric", month: "short", day: "numeric" }
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        statusColor[order.status] || "bg-muted text-muted-foreground"
                      }`}
                    >
                      {lang === "ar"
                        ? statusLabel[order.status]?.ar || order.status
                        : statusLabel[order.status]?.en || order.status}
                    </span>
                    <p className="font-bold text-primary text-lg">
                      {formatPrice(order.total, "JOD", lang)}
                    </p>
                  </div>
                </div>

                {/* Order items */}
                {Array.isArray(order.items) && order.items.length > 0 && (
                  <div className="divide-y divide-border/50">
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 py-2.5">
                        <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                          {item.productImage ? (
                            <img
                              src={item.productImage}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-5 h-5 m-2.5 text-muted-foreground/40" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {lang === "ar" ? item.productNameAr : item.productNameEn}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {lang === "ar" ? "الكمية" : "Qty"}: {item.quantity} ×{" "}
                            {formatPrice(item.price, "JOD", lang)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
