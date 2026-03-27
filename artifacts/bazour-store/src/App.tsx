import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Pages
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import Profile from "./pages/Profile";
import About from "./pages/About";
import Articles from "./pages/Articles";
import ArticleDetail from "./pages/ArticleDetail";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProductsAdmin from "./pages/admin/ProductsAdmin";
import OrdersAdmin from "./pages/admin/OrdersAdmin";
import CategoriesAdmin from "./pages/admin/CategoriesAdmin";
import UsersAdmin from "./pages/admin/UsersAdmin";
import ShippingAdmin from "./pages/admin/ShippingAdmin";
import SettingsAdmin from "./pages/admin/SettingsAdmin";
import ArticlesAdmin from "./pages/admin/ArticlesAdmin";
import ReviewsAdmin from "./pages/admin/ReviewsAdmin";
import AdminProfile from "./pages/admin/AdminProfile";
import NotFound from "./pages/not-found";

// Layout
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { CartDrawer } from "./components/layout/CartDrawer";
import { useAppStore } from "./lib/store";
import { useEffect } from "react";

const queryClient = new QueryClient();

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
      <CartDrawer />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      {/* Admin routes */}
      <Route path="/admin" component={() => <AdminLayout><AdminDashboard /></AdminLayout>} />
      <Route path="/admin/products" component={() => <AdminLayout><ProductsAdmin /></AdminLayout>} />
      <Route path="/admin/orders" component={() => <AdminLayout><OrdersAdmin /></AdminLayout>} />
      <Route path="/admin/categories" component={() => <AdminLayout><CategoriesAdmin /></AdminLayout>} />
      <Route path="/admin/users" component={() => <AdminLayout><UsersAdmin /></AdminLayout>} />
      <Route path="/admin/shipping" component={() => <AdminLayout><ShippingAdmin /></AdminLayout>} />
      <Route path="/admin/settings" component={() => <AdminLayout><SettingsAdmin /></AdminLayout>} />
      <Route path="/admin/articles" component={() => <AdminLayout><ArticlesAdmin /></AdminLayout>} />
      <Route path="/admin/reviews" component={() => <AdminLayout><ReviewsAdmin /></AdminLayout>} />
      <Route path="/admin/profile" component={() => <AdminLayout><AdminProfile /></AdminLayout>} />

      {/* Auth */}
      <Route path="/auth/login" component={() => <PublicLayout><Login /></PublicLayout>} />
      <Route path="/auth/register" component={() => <PublicLayout><Register /></PublicLayout>} />

      {/* Store */}
      <Route path="/" component={() => <PublicLayout><Home /></PublicLayout>} />
      <Route path="/products" component={() => <PublicLayout><Products /></PublicLayout>} />
      <Route path="/products/:id" component={() => <PublicLayout><ProductDetail /></PublicLayout>} />
      <Route path="/checkout" component={() => <PublicLayout><Checkout /></PublicLayout>} />
      <Route path="/profile" component={() => <PublicLayout><Profile /></PublicLayout>} />
      <Route path="/about" component={() => <PublicLayout><About /></PublicLayout>} />
      <Route path="/articles" component={() => <PublicLayout><Articles /></PublicLayout>} />
      <Route path="/articles/:slug" component={() => <PublicLayout><ArticleDetail /></PublicLayout>} />

      <Route component={() => <PublicLayout><NotFound /></PublicLayout>} />
    </Switch>
  );
}

function AppInit() {
  const { lang, theme } = useAppStore();

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [lang, theme]);

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppInit />
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
