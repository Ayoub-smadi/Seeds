import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { useGetProducts, useGetCategories } from "@workspace/api-client-react";
import { ProductCard } from "@/components/ui/ProductCard";
import { Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 24;

export default function Products() {
  const { t, lang } = useTranslation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [sort, setSort] = useState<any>("popular");
  const [limit, setLimit] = useState(PAGE_SIZE);

  const { data: productsData, isLoading } = useGetProducts({
    search: search || undefined,
    categoryId: category || undefined,
    sortBy: sort,
    limit,
  });

  const { data: categories } = useGetCategories();

  const total = productsData?.total ?? 0;
  const shown = productsData?.products.length ?? 0;
  const hasMore = shown < total;

  const resetLimit = () => setLimit(PAGE_SIZE);

  const handleSearch = (v: string) => { setSearch(v); resetLimit(); };
  const handleCategory = (v: string) => { setCategory(v); resetLimit(); };
  const handleSort = (v: string) => { setSort(v); resetLimit(); };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
        <h1 className="text-4xl font-display font-bold">{t('all_products')}</h1>

        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:w-72">
            <Search className={`absolute ${lang === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground`} />
            <input
              type="text"
              placeholder={t('search')}
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className={`w-full bg-card border-2 border-border rounded-xl h-12 ${lang === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all`}
            />
          </div>

          <div className="flex gap-2">
            <select
              value={category}
              onChange={(e) => handleCategory(e.target.value)}
              className="h-12 bg-card border-2 border-border rounded-xl px-4 focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="">{t('categories')}</option>
              {categories?.map(c => (
                <option key={c.id} value={c.id}>{lang === 'ar' ? c.nameAr : c.nameEn}</option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(e) => handleSort(e.target.value)}
              className="h-12 bg-card border-2 border-border rounded-xl px-4 focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="popular">{t('popular')}</option>
              <option value="newest">{t('newest')}</option>
              <option value="price_asc">{t('price_low_high')}</option>
              <option value="price_desc">{t('price_high_low')}</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse bg-card rounded-2xl p-4 h-96 border border-border" />
          ))}
        </div>
      ) : productsData?.products.length === 0 ? (
        <div className="text-center py-24 bg-card rounded-3xl border border-dashed border-border">
          <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">{lang === 'ar' ? 'لا توجد منتجات' : 'No products found'}</h2>
          <p className="text-muted-foreground">{lang === 'ar' ? 'حاول تعديل الفلاتر أو كلمة البحث.' : 'Try adjusting your filters or search term.'}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {productsData?.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {hasMore && (
            <div className="flex flex-col items-center gap-2 mt-12">
              <p className="text-sm text-muted-foreground">
                {lang === 'ar' ? `عرض ${shown} من ${total} منتج` : `Showing ${shown} of ${total} products`}
              </p>
              <Button
                variant="outline"
                className="rounded-xl gap-2 px-8"
                onClick={() => setLimit(l => l + PAGE_SIZE)}
                disabled={isLoading}
              >
                <ChevronDown className="w-4 h-4" />
                {lang === 'ar' ? 'عرض المزيد' : 'Load more'}
              </Button>
            </div>
          )}

          {!hasMore && total > PAGE_SIZE && (
            <p className="text-center text-sm text-muted-foreground mt-8">
              {lang === 'ar' ? `تم عرض جميع المنتجات (${total})` : `All ${total} products shown`}
            </p>
          )}
        </>
      )}
    </div>
  );
}
