import { Link } from "wouter";
import { motion } from "framer-motion";
import { ShoppingBag, Star, Eye } from "lucide-react";
import { Product } from "@workspace/api-client-react";
import { useTranslation } from "@/lib/i18n";
import { formatPrice, cn } from "@/lib/utils";
import { useCartStore } from "@/lib/store";
import { Button } from "./button";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { t, lang } = useTranslation();
  const addItem = useCartStore((state) => state.addItem);
  
  const name = lang === 'ar' ? product.nameAr : product.nameEn;
  const image = product.images?.[0] || "https://images.unsplash.com/photo-1598531405101-7006c64bd2db?w=800&q=80";

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={cn("group relative bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all duration-300", className)}
    >
      {product.onSale && (
        <div className="absolute top-4 start-4 z-10 bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-bold tracking-wider">
          {t('sale')}
        </div>
      )}
      
      <div className="relative aspect-square overflow-hidden bg-muted/30">
        <img 
          src={image} 
          alt={name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        
        {/* Quick actions overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-sm">
          <Button 
            variant="secondary" 
            size="icon" 
            className="rounded-full w-12 h-12 shadow-lg hover:scale-110 transition-transform"
            onClick={(e) => {
              e.preventDefault();
              addItem(product);
            }}
          >
            <ShoppingBag className="w-5 h-5 text-primary" />
          </Button>
          <Link href={`/products/${product.id}`} className="inline-flex items-center justify-center bg-secondary text-primary rounded-full w-12 h-12 shadow-lg hover:scale-110 transition-transform">
            <Eye className="w-5 h-5" />
          </Link>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-1 mb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star 
              key={i} 
              className={cn("w-3.5 h-3.5", i < (product.rating || 5) ? "fill-accent text-accent" : "fill-muted text-muted-foreground")} 
            />
          ))}
          <span className="text-xs text-muted-foreground ms-1">({product.reviewCount || 0})</span>
        </div>
        
        <Link href={`/products/${product.id}`} className="block">
          <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
            {name}
          </h3>
        </Link>
        
        <div className="mt-3 flex items-end justify-between">
          <div>
            {product.onSale && product.salePrice ? (
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-primary">{formatPrice(product.salePrice, 'SAR', lang)}</span>
                <span className="text-sm text-muted-foreground line-through">{formatPrice(product.price, 'SAR', lang)}</span>
              </div>
            ) : (
              <span className="font-bold text-lg text-foreground">{formatPrice(product.price, 'SAR', lang)}</span>
            )}
          </div>
          
          <button 
            onClick={() => addItem(product)}
            className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
