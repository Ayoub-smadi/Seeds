import { useState } from "react";
import { useGetUsers } from "@workspace/api-client-react";
import { useTranslation } from "@/lib/i18n";
import { Users, Search, Shield, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function UsersAdmin() {
  const { t, lang } = useTranslation();
  const { data, isLoading } = useGetUsers();
  const [search, setSearch] = useState("");

  const users = data?.users ?? [];

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-card p-6 rounded-3xl border border-border shadow-sm">
        <div>
          <h1 className="text-3xl font-bold font-display">{t('users')}</h1>
          <p className="text-muted-foreground mt-1">
            {lang === 'ar' ? `${data?.total ?? 0} مستخدم مسجل` : `${data?.total ?? 0} registered users`}
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

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground text-sm border-b border-border">
              <th className="px-6 py-4 font-medium">{t('name')}</th>
              <th className="px-6 py-4 font-medium">{t('email')}</th>
              <th className="px-6 py-4 font-medium">{t('phone')}</th>
              <th className="px-6 py-4 font-medium">{t('role')}</th>
              <th className="px-6 py-4 font-medium">{t('joined')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</td></tr>
            ) : !filtered.length ? (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">{t('no_users')}</td></tr>
            ) : filtered.map((user) => (
              <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
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
                    {user.role === 'admin' ? (lang === 'ar' ? 'مدير' : 'Admin') : (lang === 'ar' ? 'عميل' : 'Customer')}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-JO' : 'en-GB') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
