import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingBag, Menu, User, Search, Moon, Sun, X, Home, ShoppingBag as ShopIcon, LogIn, ChevronRight } from "lucide-react";
import { useAppStore, useCartStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { BazourLogo } from "@/components/ui/BazourLogo";
import { useGetCurrentUser } from "@workspace/api-client-react";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export function Navbar() {
  const [location, setLocation] = useLocation();
  const { lang, setLang, theme, setTheme } = useAppStore();
  const { t } = useTranslation();
  const cartItems = useCartStore((state) => state.items);
  const setIsCartOpen = useCartStore((state) => state.setIsOpen);

  const { data: user } = useGetCurrentUser();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const toggleLang = () => setLang(lang === "ar" ? "en" : "ar");
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Auto-focus search input when opened
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  // Close search on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearchOpen(false);
    setSearchQuery("");
    setLocation(`/products?q=${encodeURIComponent(q)}`);
  };

  const navLinks = [
    { href: "/", label: lang === "ar" ? "الرئيسية" : "Home", icon: Home },
    { href: "/products", label: lang === "ar" ? "المتجر" : "Shop", icon: ShopIcon },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full glass border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            {/* Mobile menu button */}
            <div className="flex items-center lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>

            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <BazourLogo size="md" href="/" />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-10 rtl:flex-row-reverse">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-base font-semibold hover:text-primary transition-colors px-2 py-1",
                    location === link.href ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Icons / Actions */}
            <div className="flex items-center gap-3 sm:gap-5">
              {/* Search */}
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </Button>

              {/* Theme */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-muted-foreground hover:text-foreground"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              {/* Language */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleLang}
                className="text-muted-foreground hover:text-foreground font-semibold"
              >
                {lang === "ar" ? "EN" : "ع"}
              </Button>

              {/* User / Avatar */}
              {user ? (
                <Link href={user.role === "admin" ? "/admin" : "/profile"}>
                  <button className="w-9 h-9 rounded-full overflow-hidden border-2 border-primary/30 hover:border-primary transition-colors flex items-center justify-center bg-muted">
                    {(user as any).avatarUrl ? (
                      <img
                        src={(user as any).avatarUrl}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </Link>
              ) : (
                <Link href="/auth/login">
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
              )}

              {/* Cart */}
              <Button
                variant="default"
                size="icon"
                className="relative rounded-full"
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -end-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground border-2 border-background">
                    {cartCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div
          className={cn(
            "lg:hidden overflow-hidden transition-all duration-300 border-t border-border bg-card/95 backdrop-blur-sm",
            mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <nav className="px-4 py-4 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors",
                    location === link.href
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                  <ChevronRight className={cn("w-4 h-4 ms-auto opacity-40", lang === "ar" && "rotate-180")} />
                </Link>
              );
            })}

            <div className="border-t border-border pt-3 mt-3">
              {user ? (
                <Link
                  href={user.role === "admin" ? "/admin" : "/profile"}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-muted border border-primary/30 flex items-center justify-center flex-shrink-0">
                    {(user as any).avatarUrl ? (
                      <img src={(user as any).avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <ChevronRight className={cn("w-4 h-4 opacity-40", lang === "ar" && "rotate-180")} />
                </Link>
              ) : (
                <Link
                  href="/auth/login"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  <LogIn className="w-5 h-5" />
                  <span>{lang === "ar" ? "تسجيل الدخول" : "Sign In"}</span>
                </Link>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Search Overlay */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSearchOpen(false); }}
        >
          <div className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
            <form onSubmit={handleSearch} className="flex items-center gap-3 p-4">
              <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === "ar" ? "ابحث عن منتج..." : "Search products..."}
                className="flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground/60"
                dir={lang === "ar" ? "rtl" : "ltr"}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </form>
            <div className="border-t border-border px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {lang === "ar" ? "اضغط Enter للبحث" : "Press Enter to search"}
              </span>
              <button
                onClick={() => setSearchOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground font-medium"
              >
                {lang === "ar" ? "إغلاق" : "Close"} (Esc)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
