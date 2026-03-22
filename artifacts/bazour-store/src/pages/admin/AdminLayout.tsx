import { Link, useLocation } from "wouter";
import { Package, FolderTree, ShoppingCart, Users, Truck, Settings, LogOut, LayoutDashboard } from "lucide-react";
import { useGetCurrentUser } from "@workspace/api-client-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading } = useGetCurrentUser();

  if (isLoading) return null;
  if (!user || user.role !== 'admin') {
    setLocation("/auth/login");
    return null;
  }

  const menu = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/categories", label: "Categories", icon: FolderTree },
    { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/shipping", label: "Shipping Zones", icon: Truck },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem("bazour_token");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-muted/20 flex" dir="ltr">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border fixed inset-y-0 left-0 flex flex-col">
        <div className="h-20 flex items-center px-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Bazour" className="h-8 w-8 object-contain dark:invert" />
            <span className="font-display font-bold text-xl text-primary">Admin</span>
          </Link>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-1">
          {menu.map(item => {
            const isActive = location === item.href || (item.href !== "/admin" && location.startsWith(item.href));
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-muted/50">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user.name}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
