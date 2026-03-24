import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "@/lib/i18n";
import { Calendar, ArrowRight, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

interface Section {
  type: "text" | "image";
  contentAr?: string;
  contentEn?: string;
  imageUrl?: string;
  caption?: string;
}

interface Article {
  id: string;
  titleAr: string;
  titleEn: string;
  slug: string;
  excerptAr?: string;
  excerptEn?: string;
  coverImage?: string;
  sections: Section[];
  published: boolean;
  createdAt: string;
}

export default function ArticleDetail() {
  const [location] = useLocation();
  const slug = location.split("/articles/")[1];
  const { lang } = useTranslation();
  const isAr = lang === "ar";
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`${BASE}/api/articles/${slug}`)
      .then(r => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      })
      .then(data => { if (data) setArticle(data); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-3/4" />
        <div className="h-64 bg-muted rounded-2xl" />
        <div className="space-y-3">
          <div className="h-4 bg-muted rounded" />
          <div className="h-4 bg-muted rounded w-5/6" />
          <div className="h-4 bg-muted rounded w-4/6" />
        </div>
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4">
        <p className="text-muted-foreground">{isAr ? "المقال غير موجود." : "Article not found."}</p>
        <Link href="/articles" className="text-primary hover:underline text-sm">{isAr ? "العودة للمقالات" : "Back to Articles"}</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
      {/* Back */}
      <Link href="/articles" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
        {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
        {isAr ? "العودة للمقالات" : "Back to Articles"}
      </Link>

      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold font-display leading-tight">
          {isAr ? article.titleAr : article.titleEn}
        </h1>
        {(isAr ? article.excerptAr : article.excerptEn) && (
          <p className="text-muted-foreground text-lg">
            {isAr ? article.excerptAr : article.excerptEn}
          </p>
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{new Date(article.createdAt).toLocaleDateString(isAr ? "ar-JO" : "en-GB")}</span>
        </div>
      </div>

      {/* Cover image */}
      {article.coverImage && (
        <div className="rounded-2xl overflow-hidden border border-border">
          <img src={article.coverImage} alt={isAr ? article.titleAr : article.titleEn} className="w-full object-cover max-h-96" />
        </div>
      )}

      {/* Sections */}
      <div className="space-y-8">
        {(article.sections as Section[]).map((section, i) => {
          if (section.type === "text") {
            const content = isAr ? section.contentAr : section.contentEn;
            if (!content) return null;
            return (
              <p key={i} className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap">
                {content}
              </p>
            );
          }
          if (section.type === "image" && section.imageUrl) {
            return (
              <figure key={i} className="space-y-2">
                <div className="rounded-2xl overflow-hidden border border-border">
                  <img src={section.imageUrl} alt={section.caption || ""} className="w-full object-cover" />
                </div>
                {section.caption && (
                  <figcaption className="text-xs text-muted-foreground text-center">{section.caption}</figcaption>
                )}
              </figure>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
