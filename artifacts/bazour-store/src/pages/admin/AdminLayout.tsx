import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { Package, FolderTree, ShoppingCart, Users, Truck, Settings, LogOut, LayoutDashboard, Globe } from "lucide-react";
import { useGetCurrentUser } from "@workspace/api-client-react";
import { useTranslation } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { BazourLogo } from "@/components/ui/BazourLogo";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading } = useGetCurrentUser();
  const { t, lang } = useTranslation();
  const { setLang } = useAppStore();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      setLocation("/auth/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) return null;
  if (!user || user.role !== 'admin') return null;

  const menu = [
    { href: "/admin", label: t('dashboard'), icon: LayoutDashboard, exact: true },
    { href: "/admin/products", label: t('products'), icon: Package },
    { href: "/admin/categories", label: t('categories'), icon: FolderTree },
    { href: "/admin/orders", label: t('orders'), icon: ShoppingCart },
    { href: "/admin/users", label: t('users'), icon: Users },
    { href: "/admin/shipping", label: t('shipping_zones'), icon: Truck },
    { href: "/admin/settings", label: t('store_settings'), icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem("bazour_token");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-muted/20 flex" dir="ltr">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border fixed inset-y-0 left-0 flex flex-col z-40">
        <div className="h-20 flex items-center px-6 border-b border-border">
          <BazourLogo size="sm" href="/" />
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {menu.map(item => {
            const isActive = item.exact
              ? location === item.href
              : location === item.href || (item.href !== "/admin" && location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          {/* Language toggle */}
          <Button
            variant="outline"
            size="sm"
            className="w-full rounded-xl gap-2 text-sm"
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          >
            <Globe className="w-4 h-4" />
            {lang === 'ar' ? 'English' : 'العربية'}
          </Button>

          {/* User info */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
