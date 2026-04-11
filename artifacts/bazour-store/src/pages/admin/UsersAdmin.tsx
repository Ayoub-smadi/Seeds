import { useState } from "react";
import { useGetUsers } from "@workspace/api-client-react";
import { useTranslation } from "@/lib/i18n";
import { Users, Search, Shield, User as UserIcon, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

function authHeader(): Record<string, string> {
  const token = localStorage.getItem("bazour_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function UsersAdmin() {
  const { t, lang } = useTranslation();
  const { data, isLoading, refetch } = useGetUsers();
  const [search, setSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const isAr = lang === "ar";
  const users: any[] = data?.users ?? [];

  const filtered = users.filter((u) =>
    String(u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    String(u.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`${BASE}/api/users/${id}`, {
        method: "DELETE",
        headers: authHeader(),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        showToast(body?.message || (isAr ? "فشل الحذف" : "Delete failed"), false);
        return;
      }
      showToast(isAr ? "تم حذف المستخدم" : "User deleted");
      refetch();
    } catch {
      showToast(isAr ? "حدث خطأ" : "Something went wrong", false);
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="space-y-8">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-white font-medium ${toast.ok ? "bg-green-600" : "bg-red-600"}`}>
          {toast.msg}
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{isAr ? "تأكيد الحذف" : "Confirm Delete"}</h3>
              <button onClick={() => setConfirmDeleteId(null)} className="p-1 rounded-lg hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-muted-foreground text-sm">
              {isAr
                ? "هل أنت متأكد أنك تريد حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء."
                : "Are you sure you want to delete this user? This action cannot be undone."}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium disabled:opacity-50"
              >
                {deleting ? (isAr ? "جاري الحذف..." : "Deleting...") : (isAr ? "حذف" : "Delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center bg-card p-6 rounded-3xl border border-border shadow-sm">
        <div>
          <h1 className="text-3xl font-bold font-display">{t('users')}</h1>
          <p className="text-muted-foreground mt-1">
            {isAr ? `${data?.total ?? 0} مستخدم مسجل` : `${data?.total ?? 0} registered users`}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rtl:left-auto rtl:right-3" />
            <input
              type="text"
              placeholder={t('search_users')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rtl:pr-9 rtl:pl-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground text-sm border-b border-border">
                <th className="px-6 py-4 font-medium">{t('name')}</th>
                <th className="px-6 py-4 font-medium">{t('email')}</th>
                <th className="px-6 py-4 font-medium">{t('phone')}</th>
                <th className="px-6 py-4 font-medium">{t('role')}</th>
                <th className="px-6 py-4 font-medium">{t('joined')}</th>
                <th className="px-6 py-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">{isAr ? 'جاري التحميل...' : 'Loading...'}</td></tr>
              ) : !filtered.length ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">{t('no_users')}</td></tr>
              ) : filtered.map((user) => (
                <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {user.name?.charAt(0)?.toUpperCase() ?? '?'}
                      </div>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{user.email}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{user.phone || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold",
                      user.role === 'admin'
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {user.role === 'admin' ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                      {user.role === 'admin' ? (isAr ? 'مدير' : 'Admin') : (isAr ? 'عميل' : 'Customer')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString(isAr ? 'ar-JO' : 'en-GB') : '—'}
                  </td>
                  <td className="px-6 py-4">
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => setConfirmDeleteId(user.id)}
                        className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                        title={isAr ? "حذف المستخدم" : "Delete user"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
