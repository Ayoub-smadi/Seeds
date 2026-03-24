import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useTranslation } from "@/lib/i18n";
import { Calendar, BookOpen } from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

interface Article {
  id: string;
  titleAr: string;
  titleEn: string;
  slug: string;
  excerptAr?: string;
  excerptEn?: string;
  coverImage?: string;
  published: boolean;
  createdAt: string;
}

export default function Articles() {
  const { lang } = useTranslation();
  const isAr = lang === "ar";
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/api/articles`)
      .then(r => r.json())
      .then(data => setArticles(Array.isArray(data) ? data.filter((a: Article) => a.published) : []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
          <BookOpen className="w-4 h-4" />
          {isAr ? "المقالات" : "Articles"}
        </div>
        <h1 className="text-4xl font-bold font-display">
          {isAr ? "مقالات ونصائح زراعية" : "Gardening Articles & Tips"}
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          {isAr ? "اكتشف مقالاتنا المتخصصة في عالم الزراعة والبستنة والبذور." : "Discover our specialized articles in the world of agriculture, gardening, and seeds."}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse">
              <div className="h-48 bg-muted" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>{isAr ? "لا توجد مقالات بعد." : "No articles yet."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map(article => (
            <Link key={article.id} href={`/articles/${article.slug}`}>
              <div className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group">
                {article.coverImage ? (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={article.coverImage}
                      alt={isAr ? article.titleAr : article.titleEn}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-primary/30" />
                  </div>
                )}
                <div className="p-5 space-y-3">
                  <h2 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                    {isAr ? article.titleAr : article.titleEn}
                  </h2>
                  {(isAr ? article.excerptAr : article.excerptEn) && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {isAr ? article.excerptAr : article.excerptEn}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(article.createdAt).toLocaleDateString(isAr ? "ar-JO" : "en-GB")}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
