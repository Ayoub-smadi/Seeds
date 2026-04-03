import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Leaf, ShieldCheck, Sprout, Tag } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useGetProducts, useGetCategories } from "@workspace/api-client-react";
import { ProductCard } from "@/components/ui/ProductCard";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const HERO_SLIDES = [
  {
    url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1920&q=85&fit=crop",
    alt: "Sunlit garden",
  },
  {
    url: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=1920&q=85&fit=crop",
    alt: "Lush green garden",
  },
  {
    url: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=1920&q=85&fit=crop",
    alt: "Beautiful plants",
  },
];

function HeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(i => (i + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <AnimatePresence mode="sync">
        <motion.img
          key={index}
          src={HERO_SLIDES[index].url}
          alt={HERO_SLIDES[index].alt}
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />
      </AnimatePresence>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${i === index ? "bg-white w-6" : "bg-white/50 hover:bg-white/80"}`}
          />
        ))}
      </div>
    </>
  );
}

export default function Home() {
  const { t, lang } = useTranslation();
  
  const { data: featuredData } = useGetProducts({ limit: 8, sortBy: "popular" });
  const { data: saleData } = useGetProducts({ limit: 8, onSale: true });
  const { data: categories } = useGetCategories();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <HeroCarousel />
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold mb-6 drop-shadow-lg leading-tight">
              {t('hero_title')}
            </h1>
            <p className="text-lg md:text-2xl mb-10 max-w-2xl mx-auto text-white/90 drop-shadow-md font-light">
              {t('hero_subtitle')}
            </p>
            <Link href="/products" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 transition-all hover:scale-105 shadow-[0_0_40px_rgba(45,90,62,0.6)]">
              {t('shop_now')}
              <ArrowRight className={cn("w-5 h-5", lang === 'ar' && "rotate-180")} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center p-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                <Sprout className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-xl mb-2">{lang === 'ar' ? 'بذور عضوية 100%' : '100% Organic Seeds'}</h3>
              <p className="text-muted-foreground">{t('feature_organic_desc')}</p>
            </div>
            <div className="flex flex-col items-center p-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-xl mb-2">{lang === 'ar' ? 'ضمان الإنبات' : 'Germination Guarantee'}</h3>
              <p className="text-muted-foreground">{t('feature_germination_desc')}</p>
            </div>
            <div className="flex flex-col items-center p-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                <Leaf className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-xl mb-2">{lang === 'ar' ? 'تغليف صديق للبيئة' : 'Eco-Friendly'}</h3>
              <p className="text-muted-foreground">{t('feature_eco_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold">{t('categories')}</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {categories?.slice(0, 4)?.map((category, i) => (
            <Link key={category.id} href={`/products?categoryId=${category.id}`}>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative aspect-[4/5] rounded-3xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all"
              >
                <img 
                  src={category.imageUrl || (i%2===0 ? `${import.meta.env.BASE_URL}images/category-seeds.png` : `${import.meta.env.BASE_URL}images/category-plants.png`)} 
                  alt={lang === 'ar' ? category.nameAr : category.nameEn}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-6">
                  <h3 className="text-white font-bold text-2xl group-hover:text-primary-foreground transition-colors">
                    {lang === 'ar' ? category.nameAr : category.nameEn}
                  </h3>
                  <p className="text-white/80 text-sm mt-1">{category.productCount || 0} Products</p>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* Sale Products */}
      {saleData && saleData.products.length > 0 && (
        <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <div className="inline-flex items-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-1 rounded-full text-sm font-semibold mb-3">
                <Tag className="w-3.5 h-3.5" />
                {lang === 'ar' ? 'عروض حصرية' : 'Exclusive Deals'}
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-bold">
                {lang === 'ar' ? 'منتجات مخفضة' : 'On Sale'}
              </h2>
            </div>
            <Link href="/products?onSale=true" className="hidden sm:inline-flex items-center text-primary font-semibold hover:underline">
              {lang === 'ar' ? 'عرض الكل' : 'View All'} <ArrowRight className={cn("ms-2 w-4 h-4", lang === 'ar' && "rotate-180")} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {saleData.products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">{t('featured')}</h2>
              <p className="text-muted-foreground">{t('featured_subtitle')}</p>
            </div>
            <Link href="/products" className="hidden sm:inline-flex items-center text-primary font-semibold hover:underline">
              {t('all_products')} <ArrowRight className={cn("ms-2 w-4 h-4", lang === 'ar' && "rotate-180")} />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {featuredData?.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

