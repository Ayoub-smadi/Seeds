import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Leaf, ShieldCheck, Sprout } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useGetProducts, useGetCategories } from "@workspace/api-client-react";
import { ProductCard } from "@/components/ui/ProductCard";

export default function Home() {
  const { t, lang } = useTranslation();
  
  const { data: featuredData } = useGetProducts({ limit: 8, sortBy: "popular" });
  const { data: categories } = useGetCategories();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <img 
          src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
          alt="Botanical Greenhouse"
          className="absolute inset-0 w-full h-full object-cover scale-105 animate-[pulse_60s_ease-in-out_infinite_alternate]"
        />
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium tracking-widest uppercase mb-6">
              {lang === 'ar' ? 'مجموعة 2025' : 'Collection 2025'}
            </span>
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
              <p className="text-muted-foreground">Certified organic, non-GMO seeds for your garden.</p>
            </div>
            <div className="flex flex-col items-center p-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-xl mb-2">{lang === 'ar' ? 'ضمان الإنبات' : 'Germination Guarantee'}</h3>
              <p className="text-muted-foreground">We test every batch to ensure high germination rates.</p>
            </div>
            <div className="flex flex-col items-center p-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                <Leaf className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-xl mb-2">{lang === 'ar' ? 'تغليف صديق للبيئة' : 'Eco-Friendly'}</h3>
              <p className="text-muted-foreground">Sustainable packaging that loves the earth as much as you do.</p>
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
          {categories?.slice(0, 4).map((category, i) => (
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

      {/* Featured Products */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">{t('featured')}</h2>
              <p className="text-muted-foreground">Handpicked selections for your botanical journey.</p>
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

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
