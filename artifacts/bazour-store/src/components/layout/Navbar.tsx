import { Link, useLocation } from "wouter";
import { ShoppingBag, Menu, User, Search, Moon, Sun } from "lucide-react";
import { useAppStore, useCartStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { BazourLogo } from "@/components/ui/BazourLogo";
import { useGetCurrentUser } from "@workspace/api-client-react";

export function Navbar() {
  const [location] = useLocation();
  const { lang, setLang, theme, setTheme } = useAppStore();
  const { t } = useTranslation();
  const cartItems = useCartStore((state) => state.items);
  const setIsCartOpen = useCartStore((state) => state.setIsOpen);
  
  const { data: user } = useGetCurrentUser();
  
  const toggleLang = () => setLang(lang === 'ar' ? 'en' : 'ar');
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <Button variant="ghost" size="icon" className="text-foreground">
              <Menu className="h-6 w-6" />
            </Button>
          </div>

          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <BazourLogo size="md" href="/" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-10 rtl:flex-row-reverse">
            <Link href="/" className={cn("text-base font-semibold hover:text-primary transition-colors px-2 py-1", location === '/' ? 'text-primary' : 'text-muted-foreground')}>
              {t('home')}
            </Link>
            <Link href="/products" className={cn("text-base font-semibold hover:text-primary transition-colors px-2 py-1", location === '/products' ? 'text-primary' : 'text-muted-foreground')}>
              {t('shop')}
            </Link>
          </nav>

          {/* Icons / Actions */}
          <div className="flex items-center gap-3 sm:gap-5">
            <Button variant="ghost" size="icon" className="hidden sm:flex text-muted-foreground hover:text-foreground">
              <Search className="h-5 w-5" />
            </Button>
            
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground hover:text-foreground">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            
            <Button variant="ghost" size="icon" onClick={toggleLang} className="text-muted-foreground hover:text-foreground font-semibold">
              {lang === 'ar' ? 'EN' : 'ع'}
            </Button>

            {user ? (
              <Link href={user.role === 'admin' ? '/admin' : '/orders'}>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <User className="h-5 w-5" />
                </Button>
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
    </header>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
