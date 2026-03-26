import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useTranslation } from "@/lib/i18n";
import { useGetProduct } from "@workspace/api-client-react";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingBag, Star, CheckCircle2, ShieldCheck, Truck, Send, User } from "lucide-react";
import { motion } from "framer-motion";

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

interface RelatedProduct {
  id: string;
  nameAr: string;
  nameEn: string;
  price: number;
  salePrice?: number;
  onSale: boolean;
  images: string[];
  rating: number;
  reviewCount: number;
}

function StarRating({ value, onChange, size = "md" }: { value: number; onChange?: (v: number) => void; size?: "sm" | "md" }) {
  const [hovered, setHovered] = useState(0);
  const sz = size === "sm" ? "w-4 h-4" : "w-6 h-6";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i)}
          onMouseEnter={() => onChange && setHovered(i)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
        >
          <Star
            className={`${sz} transition-colors ${
              i <= (hovered || value)
                ? "fill-yellow-400 text-yellow-400"
                : "fill-transparent text-muted-foreground/40"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useTranslation();
  const addItem = useCartStore(s => s.addItem);
  const token = typeof window !== "undefined" ? localStorage.getItem("bazour_token") : null;

  const { data: product, isLoading, error } = useGetProduct(id || "");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [related, setRelated] = useState<RelatedProduct[]>([]);

  const isAr = lang === "ar";

  useEffect(() => {
    if (!id) return;
    setReviewsLoading(true);
    fetch(`/api/products/${id}/reviews`)
      .then(r => r.json())
      .then(d => setReviews(d.reviews || []))
      .finally(() => setReviewsLoading(false));

    fetch(`/api/products/${id}/related`)
      .then(r => r.json())
      .then(d => setRelated(d.products || []));
  }, [id]);

  const handleSubmitReview = async () => {
    if (!token) {
      setReviewMsg({ text: isAr ? "يجب تسجيل الدخول أولاً" : "You must be logged in to review", ok: false });
      return;
    }
    if (newRating === 0) {
      setReviewMsg({ text: isAr ? "اختر عدد النجوم" : "Please select a rating", ok: false });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating: newRating, comment: newComment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error");
      setReviews(prev => [data, ...prev]);
      setNewRating(0);
      setNewComment("");
      setReviewMsg({ text: isAr ? "تم إضافة تقييمك بنجاح!" : "Review submitted successfully!", ok: true });
    } catch (err: unknown) {
      setReviewMsg({ text: err instanceof Error ? err.message : (isAr ? "حدث خطأ" : "Error"), ok: false });
    } finally {
      setSubmitting(false);
      setTimeout(() => setReviewMsg(null), 4000);
    }
  };

  if (isLoading) return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (error || !product) return <div className="h-screen flex items-center justify-center">Product not found</div>;

  const name = lang === "ar" ? product.nameAr : product.nameEn;
  const desc = lang === "ar" ? product.descriptionAr : product.descriptionEn;
  const images = product.images?.length ? product.images : ["https://images.unsplash.com/photo-1598531405101-7006c64bd2db?w=800&q=80"];
  const avgRating = product.rating || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-24">

      {/* Main product grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
        {/* Images */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="aspect-square rounded-3xl overflow-hidden bg-muted border border-border"
          >
            <img src={images[activeImage]} alt={name} className="w-full h-full object-cover" />
          </motion.div>
          {images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${activeImage === idx ? "border-primary ring-2 ring-primary/20" : "border-transparent opacity-70 hover:opacity-100"}`}
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
              <StarRating value={Math.round(avgRating)} size="sm" />
              <span className="text-muted-foreground text-sm">
                ({product.reviewCount || 0} {isAr ? "تقييم" : "reviews"})
              </span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-display font-bold mb-4">{name}</h1>
            <div className="flex items-end gap-4 mt-6">
              {product.onSale && product.salePrice ? (
                <>
                  <span className="text-4xl font-bold text-primary">{formatPrice(product.salePrice, "SAR", lang)}</span>
                  <span className="text-xl text-muted-foreground line-through mb-1">{formatPrice(product.price, "SAR", lang)}</span>
                  <span className="bg-accent text-white px-3 py-1 rounded-full text-sm font-bold mb-1">SALE</span>
                </>
              ) : (
                <span className="text-4xl font-bold text-foreground">{formatPrice(product.price, "SAR", lang)}</span>
              )}
            </div>
          </div>

          <p className="text-lg text-muted-foreground leading-relaxed mb-10 border-b border-border pb-10">
            {desc || (isAr ? "منتج مميز مختار بعناية لمجموعتك النباتية." : "A premium product carefully selected for your botanical collection.")}
          </p>

          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center bg-card border-2 border-border rounded-2xl h-14 p-1 w-36">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-full flex items-center justify-center rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="flex-1 text-center font-bold text-lg">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-full flex items-center justify-center rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <Button
                onClick={() => addItem(product, quantity)}
                className="flex-1 h-14 text-lg rounded-2xl shadow-lg shadow-primary/25 hover:-translate-y-1 transition-all"
              >
                <ShoppingBag className="w-5 h-5 ms-2" />
                {t("add_to_cart")}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-8 border-t border-border">
              <div className="flex items-center gap-3 text-muted-foreground">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span>{t("in_stock_ready")}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <span>{t("quality_guaranteed")}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Truck className="w-5 h-5 text-primary" />
                <span>{t("fast_secure_delivery")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Reviews Section ── */}
      <div className="mt-24">
        <h2 className="text-3xl font-bold font-display mb-6">
          {isAr ? "تقييمات العملاء" : "Customer Reviews"}
        </h2>

        {/* Average summary */}
        {reviews.length > 0 && (
          <div className="flex items-center gap-4 mb-8 bg-card border border-border rounded-2xl p-5 w-fit">
            <span className="text-5xl font-bold">{avgRating.toFixed(1)}</span>
            <div>
              <StarRating value={Math.round(avgRating)} />
              <p className="text-sm text-muted-foreground mt-1">
                {isAr ? `بناءً على ${reviews.length} تقييم` : `Based on ${reviews.length} reviews`}
              </p>
            </div>
          </div>
        )}

        {/* Write review form */}
        <div className="bg-card border border-border rounded-3xl p-6 mb-8">
          <h3 className="font-bold text-lg mb-5">{isAr ? "أضف تقييمك" : "Write a Review"}</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-2">
                {isAr ? "تقييمك بالنجوم" : "Your Rating"}
              </label>
              <StarRating value={newRating} onChange={setNewRating} />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-2">
                {isAr ? "تعليقك (اختياري)" : "Comment (optional)"}
              </label>
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                rows={3}
                placeholder={isAr ? "شاركنا رأيك بالمنتج..." : "Share your experience with this product..."}
                className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors resize-none"
              />
            </div>
            {reviewMsg && (
              <p className={`text-sm font-medium ${reviewMsg.ok ? "text-green-600" : "text-destructive"}`}>
                {reviewMsg.text}
              </p>
            )}
            <Button onClick={handleSubmitReview} disabled={submitting} className="rounded-xl gap-2">
              <Send className="w-4 h-4" />
              {submitting
                ? (isAr ? "جاري الإرسال..." : "Submitting...")
                : (isAr ? "إرسال التقييم" : "Submit Review")}
            </Button>
          </div>
        </div>

        {/* Reviews list */}
        {reviewsLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-3xl border border-border">
            <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>{isAr ? "لا توجد تقييمات بعد. كن أول من يقيّم!" : "No reviews yet. Be the first to review!"}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map(review => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-2xl p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{review.userName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString(isAr ? "ar-JO" : "en-JO", {
                          year: "numeric", month: "short", day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <StarRating value={review.rating} size="sm" />
                </div>
                {review.comment && (
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Related Products ── */}
      {related.length > 0 && (
        <div className="mt-24">
          <h2 className="text-3xl font-bold font-display mb-8">
            {isAr ? "منتجات مشابهة" : "Related Products"}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {related.map(p => {
              const pName = isAr ? p.nameAr : p.nameEn;
              const pImg = p.images?.[0] || "https://images.unsplash.com/photo-1598531405101-7006c64bd2db?w=400&q=70";
              return (
                <Link key={p.id} href={`/products/${p.id}`}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="bg-card border border-border rounded-2xl overflow-hidden cursor-pointer group transition-shadow hover:shadow-lg"
                  >
                    <div className="aspect-square overflow-hidden bg-muted">
                      <img
                        src={pImg}
                        alt={pName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <p className="font-semibold text-sm line-clamp-2 mb-2">{pName}</p>
                      <div className="flex items-center gap-1 mb-2">
                        <StarRating value={Math.round(p.rating || 0)} size="sm" />
                        <span className="text-xs text-muted-foreground">({p.reviewCount || 0})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {p.onSale && p.salePrice ? (
                          <>
                            <span className="font-bold text-primary text-sm">{formatPrice(p.salePrice, "SAR", lang)}</span>
                            <span className="text-xs text-muted-foreground line-through">{formatPrice(p.price, "SAR", lang)}</span>
                          </>
                        ) : (
                          <span className="font-bold text-sm">{formatPrice(p.price, "SAR", lang)}</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
