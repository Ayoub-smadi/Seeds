import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "@/lib/i18n";
import { useCartStore } from "@/lib/store";
import { useCurrency } from "@/lib/useCurrency";
import { Button } from "@/components/ui/button";
import { useCreateOrder, useGetShippingZones, useGetCurrentUser } from "@workspace/api-client-react";
import { Banknote, MapPin, Truck, CheckCircle2 } from "lucide-react";

const checkoutSchema = z.object({
  shippingAddress: z.object({
    name: z.string().min(2),
    phone: z.string().min(8),
    city: z.string().min(2),
    area: z.string().min(2),
    street: z.string().min(2),
  }),
  shippingZoneId: z.string().min(1),
  paymentMethod: z.enum(['cash_on_delivery']),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const { t, lang } = useTranslation();
  const { format } = useCurrency();
  const [_, setLocation] = useLocation();
  const { items, getTotal, clearCart } = useCartStore();
  const [orderSuccess, setOrderSuccess] = useState(false);
  const { data: currentUser, isLoading: isAuthLoading } = useGetCurrentUser();

  useEffect(() => {
    if (!isAuthLoading && !currentUser) {
      setLocation("/auth/login");
    }
  }, [isAuthLoading, currentUser, setLocation]);

  const { data: shippingZones } = useGetShippingZones();
  const { mutate: createOrder, isPending } = useCreateOrder({
    mutation: {
      onSuccess: () => {
        clearCart();
        setOrderSuccess(true);
        setTimeout(() => setLocation("/"), 3000);
      },
      onError: (err) => {
        alert(err.message || 'Error placing order');
      }
    }
  });

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: 'cash_on_delivery',
    }
  });

  const FREE_SHIPPING_THRESHOLD = 80;
  const subtotal = getTotal();
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;

  const selectedZoneId = watch('shippingZoneId');
  const selectedZone = shippingZones?.find(z => z.id === selectedZoneId);
  const shippingCost = isFreeShipping ? 0 : (selectedZone?.price || 0);
  const finalTotal = subtotal + shippingCost;

  if (isAuthLoading || !currentUser) {
    return <div className="min-h-[70vh] flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (orderSuccess) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <CheckCircle2 className="w-20 h-20 text-green-500 animate-bounce" />
        <h2 className="text-2xl font-bold text-green-600">
          {lang === "ar" ? "تم إرسال طلبك بنجاح! 🎉" : "Order Placed Successfully! 🎉"}
        </h2>
        <p className="text-muted-foreground">
          {lang === "ar" ? "سيتم التواصل معك قريباً. جاري تحويلك للصفحة الرئيسية..." : "We'll contact you soon. Redirecting to home..."}
        </p>
        <Button onClick={() => setLocation("/")} variant="outline">
          {lang === "ar" ? "الصفحة الرئيسية" : "Go to Home"}
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">{t('empty_cart')}</h2>
        <Button onClick={() => setLocation("/products")}>{t('continue_shopping')}</Button>
      </div>
    );
  }

  const onSubmit = (data: CheckoutForm) => {
    const cartItems = items.map(item => ({
      productId: item.product.id,
      productNameAr: item.product.nameAr,
      productNameEn: item.product.nameEn,
      productImage: item.product.images?.[0],
      quantity: item.quantity,
      price: item.product.salePrice || item.product.price,
    }));
    createOrder({ data: { ...data, cartItems } });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-display font-bold mb-12">{t('checkout')}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7">
          <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-10">
            
            {/* Shipping Address */}
            <section className="bg-card p-8 rounded-3xl border border-border shadow-sm">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <MapPin className="text-primary w-6 h-6" /> {t('shipping_details')}
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('name')} <span className="text-destructive">*</span></label>
                  <input {...register("shippingAddress.name")} className="w-full h-12 px-4 rounded-xl border-2 border-border focus:border-primary focus:ring-0" />
                  {errors.shippingAddress?.name && (
                    <p className="text-xs text-destructive">{lang === 'ar' ? 'الاسم مطلوب' : 'Name is required'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('phone')} <span className="text-destructive">*</span></label>
                  <input {...register("shippingAddress.phone")} className="w-full h-12 px-4 rounded-xl border-2 border-border focus:border-primary focus:ring-0" />
                  {errors.shippingAddress?.phone && (
                    <p className="text-xs text-destructive">{lang === 'ar' ? 'رقم الهاتف مطلوب' : 'Phone is required'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{lang === 'ar' ? 'المدينة' : 'City'} <span className="text-destructive">*</span></label>
                  <input {...register("shippingAddress.city")} className="w-full h-12 px-4 rounded-xl border-2 border-border focus:border-primary focus:ring-0" />
                  {errors.shippingAddress?.city && (
                    <p className="text-xs text-destructive">{lang === 'ar' ? 'المدينة مطلوبة' : 'City is required'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{lang === 'ar' ? 'المنطقة' : 'Area'} <span className="text-destructive">*</span></label>
                  <input {...register("shippingAddress.area")} className="w-full h-12 px-4 rounded-xl border-2 border-border focus:border-primary focus:ring-0" />
                  {errors.shippingAddress?.area && (
                    <p className="text-xs text-destructive">{lang === 'ar' ? 'المنطقة مطلوبة' : 'Area is required'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{lang === 'ar' ? 'الشارع' : 'Street'} <span className="text-destructive">*</span></label>
                  <input {...register("shippingAddress.street")} className="w-full h-12 px-4 rounded-xl border-2 border-border focus:border-primary focus:ring-0" />
                  {errors.shippingAddress?.street && (
                    <p className="text-xs text-destructive">{lang === 'ar' ? 'الشارع مطلوب' : 'Street is required'}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Shipping Zone */}
            <section className="bg-card p-8 rounded-3xl border border-border shadow-sm">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Truck className="text-primary w-6 h-6" /> {t('shipping_method')}
              </h2>
              {isFreeShipping && (
                <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-medium">
                  <span>🎉</span>
                  <span>{lang === 'ar' ? 'مبروك! تستمتع بتوصيل مجاني لطلبك' : 'Congratulations! You qualify for free shipping'}</span>
                </div>
              )}
              <div className="space-y-4">
                {shippingZones?.map(zone => (
                  <label key={zone.id} className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedZoneId === zone.id ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" value={zone.id} {...register("shippingZoneId")} className="w-5 h-5 text-primary" />
                      <span className="font-medium">{lang === 'ar' ? zone.nameAr : zone.nameEn}</span>
                    </div>
                    {isFreeShipping ? (
                      <span className="font-bold text-green-600">{lang === 'ar' ? 'مجاني' : 'Free'}</span>
                    ) : (
                      <span className="font-bold">{format(zone.price)}</span>
                    )}
                  </label>
                ))}
              </div>
            </section>

            {/* Payment Method */}
            <section className="bg-card p-8 rounded-3xl border border-border shadow-sm">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Banknote className="text-primary w-6 h-6" /> {t('payment_method')}
              </h2>
              <div className="grid grid-cols-1 gap-4">
                <label className={`flex flex-col p-6 border-2 rounded-xl cursor-pointer transition-all ${watch('paymentMethod') === 'cash_on_delivery' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <div className="flex justify-between items-center mb-4">
                    <Banknote className="w-8 h-8 text-primary" />
                    <input type="radio" value="cash_on_delivery" {...register("paymentMethod")} className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-bold text-lg">{t('cash_on_delivery')}</span>
                </label>
              </div>
            </section>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-5">
          <div className="sticky top-28 bg-card p-8 rounded-3xl border border-border shadow-xl">
            <h3 className="text-2xl font-bold mb-6">{t('order_summary')}</h3>
            
            <div className="space-y-4 mb-6">
              {items.map(item => (
                <div key={item.product.id} className="flex gap-4">
                  <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    <img src={item.product.images?.[0] || ""} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 text-sm">
                    <h4 className="font-medium line-clamp-1">{lang === 'ar' ? item.product.nameAr : item.product.nameEn}</h4>
                    <p className="text-muted-foreground">{t('qty')}: {item.quantity}</p>
                    <p className="font-bold text-primary mt-1">
                      {format((item.product.salePrice || item.product.price) * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t border-border pt-6 space-y-3">
              <div className="flex justify-between text-muted-foreground">
                <span>{t('subtotal')}</span>
                <span>{format(getTotal())}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{t('shipping')}</span>
                {isFreeShipping ? (
                  <span className="font-semibold text-green-600">{lang === 'ar' ? 'مجاني' : 'Free'}</span>
                ) : (
                  <span>{format(shippingCost)}</span>
                )}
              </div>
              <div className="flex justify-between text-2xl font-bold pt-4 border-t border-border mt-4">
                <span>{t('total')}</span>
                <span className="text-primary">{format(finalTotal)}</span>
              </div>
            </div>

            <Button 
              type="submit" 
              form="checkout-form"
              disabled={isPending}
              className="w-full h-14 text-lg rounded-xl mt-8 shadow-lg shadow-primary/25"
            >
              {isPending ? (lang === 'ar' ? 'جاري المعالجة...' : 'Processing...') : t('order_now')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
