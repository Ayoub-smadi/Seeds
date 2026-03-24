import { useState } from "react";
import { useParams } from "wouter";
import { useTranslation } from "@/lib/i18n";
import { useGetProduct } from "@workspace/api-client-react";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingBag, Star, CheckCircle2, ShieldCheck, Truck } from "lucide-react";
import { motion } from "framer-motion";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useTranslation();
  const addItem = useCartStore(s => s.addItem);
  
  const { data: product, isLoading, error } = useGetProduct(id || "");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  if (isLoading) return <div className="h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (error || !product) return <div className="h-screen flex items-center justify-center">Product not found</div>;

  const name = lang === 'ar' ? product.nameAr : product.nameEn;
  const desc = lang === 'ar' ? product.descriptionAr : product.descriptionEn;
  const images = product.images?.length ? product.images : ["https://images.unsplash.com/photo-1598531405101-7006c64bd2db?w=800&q=80"];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
        
        {/* Images */}
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="aspect-square rounded-3xl overflow-hidden bg-muted border border-border"
          >
            <img 
              src={images[activeImage]} 
              alt={name}
              className="w-full h-full object-cover"
            />
          </motion.div>
          {images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${activeImage === idx ? 'border-primary ring-2 ring-primary/20' : 'border-transparent opacity-70 hover:opacity-100'}`}
                >
                  <img src={img} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col justify-center">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center text-accent">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-5 h-5 ${i < (product.rating||5) ? 'fill-current' : 'fill-transparent stroke-muted'}`} />
                ))}
              </div>
              <span className="text-muted-foreground underline">({product.reviewCount || 0} reviews)</span>
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-display font-bold mb-4">{name}</h1>
            
            <div className="flex items-end gap-4 mt-6">
              {product.onSale && product.salePrice ? (
                <>
                  <span className="text-4xl font-bold text-primary">{formatPrice(product.salePrice, 'SAR', lang)}</span>
                  <span className="text-xl text-muted-foreground line-through mb-1">{formatPrice(product.price, 'SAR', lang)}</span>
                  <span className="bg-accent text-white px-3 py-1 rounded-full text-sm font-bold mb-1">SALE</span>
                </>
              ) : (
                <span className="text-4xl font-bold text-foreground">{formatPrice(product.price, 'SAR', lang)}</span>
              )}
            </div>
          </div>

          <p className="text-lg text-muted-foreground leading-relaxed mb-10 border-b border-border pb-10">
            {desc || "A premium product carefully selected for your botanical collection."}
          </p>

          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center bg-card border-2 border-border rounded-2xl h-14 p-1 w-36">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-full flex items-center justify-center rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="flex-1 text-center font-bold text-lg">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-full flex items-center justify-center rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              <Button 
                onClick={() => addItem(product, quantity)}
                className="flex-1 h-14 text-lg rounded-2xl shadow-lg shadow-primary/25 hover:-translate-y-1 transition-all"
              >
                <ShoppingBag className="w-5 h-5 ms-2" />
                {t('add_to_cart')}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-8 border-t border-border">
              <div className="flex items-center gap-3 text-muted-foreground">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span>{t('in_stock_ready')}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <span>{t('quality_guaranteed')}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Truck className="w-5 h-5 text-primary" />
                <span>{t('fast_secure_delivery')}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
