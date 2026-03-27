import { X, Plus, Minus, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useGetCurrentUser } from "@workspace/api-client-react";

export function CartDrawer() {
  const { isOpen, setIsOpen, items, updateQuantity, removeItem, getTotal } = useCartStore();
  const { t, lang } = useTranslation();
  const [_, setLocation] = useLocation();
  const { data: currentUser } = useGetCurrentUser();

  const handleCheckout = () => {
    setIsOpen(false);
    if (!currentUser) {
      setLocation("/auth/login");
    } else {
      setLocation("/checkout");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: lang === 'ar' ? "-100%" : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: lang === 'ar' ? "-100%" : "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed top-0 bottom-0 ${lang === 'ar' ? 'start-0' : 'end-0'} z-50 w-full max-w-md bg-background shadow-2xl flex flex-col border-s border-border`}
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                {t('cart')}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <ShoppingBag className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg">{t('empty_cart')}</p>
                  <Button variant="outline" className="mt-6" onClick={() => setIsOpen(false)}>
                    {t('continue_shopping')}
                  </Button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.product.id} className="flex gap-4 p-4 rounded-2xl bg-card border border-border shadow-sm">
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                      <img 
                        src={item.product.images?.[0] || ""} 
                        alt={lang === 'ar' ? item.product.nameAr : item.product.nameEn} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-semibold line-clamp-2">
                          {lang === 'ar' ? item.product.nameAr : item.product.nameEn}
                        </h4>
                        <button onClick={() => removeItem(item.product.id)} className="text-muted-foreground hover:text-destructive p-1">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-1">
                          <button 
                            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-background shadow-sm transition-colors disabled:opacity-50"
                            onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                          <button 
                            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-background shadow-sm transition-colors"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="font-bold text-primary">
                          {formatPrice((item.product.salePrice || item.product.price) * item.quantity, 'SAR', lang)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 border-t border-border bg-card">
                <div className="flex justify-between text-lg font-bold mb-6">
                  <span>{t('subtotal')}</span>
                  <span className="text-primary">{formatPrice(getTotal(), 'SAR', lang)}</span>
                </div>
                <Button className="w-full h-14 text-lg rounded-xl shadow-lg shadow-primary/25" onClick={handleCheckout}>
                  {t('checkout')}
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
