import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingBag, Menu, User, Search, Moon, Sun, X, Home, ShoppingBag as ShopIcon, LogIn, ChevronRight, ChevronDown } from "lucide-react";
import { useAppStore, useCartStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { BazourLogo } from "@/components/ui/BazourLogo";
import { useGetCurrentUser, useGetCategories } from "@workspace/api-client-react";
import type { Category } from "@workspace/api-client-react";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

function CategoryDropdown({ cat, lang, onNavigate }: { cat: Category; lang: string; onNavigate: (href: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasSubs = (cat.subcategories?.length ?? 0) > 0;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const name = lang === "ar" ? cat.nameAr : cat.nameEn;

  if (!hasSubs) {
    return (
      <button
        onClick={() => onNavigate(`/products?category=${cat.slug}`)}
        className="text-base font-semibold text-muted-foreground hover:text-primary transition-colors px-2 py-1"
      >
        {name}
      </button>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(v => !v)}
        className={cn(
          "flex items-center gap-1 text-base font-semibold transition-colors px-2 py-1",
          open ? "text-primary" : "text-muted-foreground hover:text-primary"
        )}
      >
        {name}
        <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div
          className={cn(
            "absolute top-full mt-1 min-w-[200px] bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50",
            lang === "ar" ? "right-0" : "left-0"
          )}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <button
            onClick={() => { onNavigate(`/products?category=${cat.slug}`); setOpen(false); }}
            className="w-full text-start px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-primary hover:text-primary-foreground transition-colors border-b border-border/50"
          >
            {lang === "ar" ? `كل ${cat.nameAr}` : `All ${cat.nameEn}`}
          </button>
          {cat.subcategories!.map(sub => (
            <button
              key={sub.id}
              onClick={() => { onNavigate(`/products?category=${sub.slug}`); setOpen(false); }}
              className="w-full text-start px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
            >
              {lang === "ar" ? sub.nameAr : sub.nameEn}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const [location, setLocation] = useLocation();
  const { lang, setLang, theme, setTheme } = useAppStore();
  const { t } = useTranslation();
  const cartItems = useCartStore((state) => state.items);
  const setIsCartOpen = useCartStore((state) => state.setIsOpen);

  const { data: user } = useGetCurrentUser();
  const { data: categories } = useGetCategories();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const toggleLang = () => setLang(lang === "ar" ? "en" : "ar");
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const parentCategories = (categories ?? []).filter(c => !c.parentId);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

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

  const [mobileCatOpen, setMobileCatOpen] = useState<string | null>(null);

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
            <nav className="hidden lg:flex items-center gap-6 rtl:flex-row-reverse">
              <Link
                href="/"
                className={cn(
                  "text-base font-semibold hover:text-primary transition-colors px-2 py-1",
                  location === "/" ? "text-primary" : "text-muted-foreground"
                )}
              >
                {lang === "ar" ? "الرئيسية" : "Home"}
              </Link>

              <Link
                href="/products"
                className={cn(
                  "text-base font-semibold hover:text-primary transition-colors px-2 py-1",
                  location === "/products" ? "text-primary" : "text-muted-foreground"
                )}
              >
                {lang === "ar" ? "المتجر" : "Shop"}
              </Link>

              {parentCategories.map(cat => (
                <CategoryDropdown
                  key={cat.id}
                  cat={cat}
                  lang={lang}
                  onNavigate={setLocation}
                />
              ))}
            </nav>

            {/* Icons / Actions */}
            <div className="flex items-center gap-3 sm:gap-5">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-muted-foreground hover:text-foreground"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleLang}
                className="text-muted-foreground hover:text-foreground font-semibold"
              >
                {lang === "ar" ? "EN" : "ع"}
              </Button>

              {user ? (
                <Link href={user.role === "admin" ? "/admin" : "/profile"}>
                  <button className="w-9 h-9 rounded-full overflow-hidden border-2 border-primary/30 hover:border-primary transition-colors flex items-center justify-center bg-muted">
                    {(user as any).avatarUrl ? (
                      <img src={(user as any).avatarUrl} alt={user.name} className="w-full h-full object-cover" />
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
            mobileOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <nav className="px-4 py-4 space-y-1">
            <Link
              href="/"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors",
                location === "/" ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
              )}
            >
              <Home className="w-5 h-5" />
              <span>{lang === "ar" ? "الرئيسية" : "Home"}</span>
              <ChevronRight className={cn("w-4 h-4 ms-auto opacity-40", lang === "ar" && "rotate-180")} />
            </Link>

            <Link
              href="/products"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors",
                location === "/products" ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
              )}
            >
              <ShopIcon className="w-5 h-5" />
              <span>{lang === "ar" ? "المتجر" : "Shop"}</span>
              <ChevronRight className={cn("w-4 h-4 ms-auto opacity-40", lang === "ar" && "rotate-180")} />
            </Link>

            {parentCategories.map(cat => (
              <div key={cat.id} className="rounded-xl overflow-hidden border border-border/50">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 font-semibold text-foreground hover:bg-muted transition-colors"
                  onClick={() => setMobileCatOpen(mobileCatOpen === cat.id ? null : cat.id)}
                >
                  <span className="flex-1 text-start">{lang === "ar" ? cat.nameAr : cat.nameEn}</span>
                  {(cat.subcategories?.length ?? 0) > 0 && (
                    <ChevronDown className={cn("w-4 h-4 opacity-50 transition-transform", mobileCatOpen === cat.id && "rotate-180")} />
                  )}
                </button>

                {mobileCatOpen === cat.id && (cat.subcategories?.length ?? 0) > 0 && (
                  <div className="border-t border-border/50 bg-muted/30">
                    <button
                      onClick={() => { setLocation(`/products?category=${cat.slug}`); setMobileOpen(false); }}
                      className="w-full text-start px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      {lang === "ar" ? `كل ${cat.nameAr}` : `All ${cat.nameEn}`}
                    </button>
                    {cat.subcategories!.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => { setLocation(`/products?category=${sub.slug}`); setMobileOpen(false); }}
                        className="w-full text-start px-6 py-2.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
                      >
                        {lang === "ar" ? sub.nameAr : sub.nameEn}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

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
                <button type="button" onClick={() => setSearchQuery("")} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              )}
            </form>
            <div className="border-t border-border px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {lang === "ar" ? "اضغط Enter للبحث" : "Press Enter to search"}
              </span>
              <button onClick={() => setSearchOpen(false)} className="text-xs text-muted-foreground hover:text-foreground font-medium">
                {lang === "ar" ? "إغلاق" : "Close"} (Esc)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
