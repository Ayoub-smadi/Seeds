import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Star, Trash2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

type Review = {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  productNameAr: string | null;
  productNameEn: string | null;
};

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </span>
  );
}

function useReviews() {
  const [data, setData] = useState<{ reviews: Review[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem("bazour_token");

  const refetch = () => {
    setIsLoading(true);
    fetch(`${BASE}/api/products/reviews/all`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { setData(d); setIsLoading(false); })
      .catch(() => { setError("Failed to load reviews"); setIsLoading(false); });
  };

  useState(() => { refetch(); });

  return { data, isLoading, error, refetch };
}

export default function ReviewsAdmin() {
  const { lang } = useTranslation();
  const isAr = lang === "ar";
  const { data, isLoading, refetch } = useReviews();
  const [search, setSearch] = useState("");
  const [filterRating, setFilterRating] = useState<number | "">("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const token = localStorage.getItem("bazour_token");

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`${BASE}/api/products/reviews/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast(isAr ? "تم حذف التقييم بنجاح" : "Review deleted successfully");
        refetch();
      } else {
        showToast(isAr ? "فشل الحذف" : "Failed to delete", false);
      }
    } catch {
      showToast(isAr ? "حدث خطأ" : "An error occurred", false);
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  };

  const reviews = data?.reviews ?? [];
  const filtered = reviews.filter((r) => {
    const nameMatch =
      r.userName.toLowerCase().includes(search.toLowerCase()) ||
      (r.productNameAr ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (r.productNameEn ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (r.comment ?? "").toLowerCase().includes(search.toLowerCase());
    const ratingMatch = filterRating === "" || r.rating === Number(filterRating);
    return nameMatch && ratingMatch;
  });

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {isAr ? "إدارة التقييمات" : "Reviews Management"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAr ? "راجع وأدِر تقييمات العملاء" : "Review and manage customer feedback"}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-card border border-border rounded-xl px-4 py-3 text-center min-w-[90px]">
            <p className="text-2xl font-bold text-primary">{reviews.length}</p>
            <p className="text-xs text-muted-foreground">{isAr ? "إجمالي" : "Total"}</p>
          </div>
          <div className="bg-card border border-border rounded-xl px-4 py-3 text-center min-w-[90px]">
            <p className="text-2xl font-bold text-yellow-500">{avgRating}</p>
            <p className="text-xs text-muted-foreground">{isAr ? "متوسط" : "Avg Rating"}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={isAr ? "ابحث عن مستخدم أو منتج أو تعليق..." : "Search by user, product or comment..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <select
          value={filterRating}
          onChange={(e) => setFilterRating(e.target.value === "" ? "" : Number(e.target.value))}
          className="bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary cursor-pointer"
        >
          <option value="">{isAr ? "كل التقييمات" : "All Ratings"}</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>{"⭐".repeat(n)} ({n})</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse bg-card border border-border rounded-xl h-20" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-card border border-dashed border-border rounded-2xl">
          <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground opacity-40 mb-3" />
          <p className="text-muted-foreground font-medium">
            {isAr ? "لا توجد تقييمات" : "No reviews found"}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-start px-4 py-3 font-semibold text-muted-foreground">
                    {isAr ? "المستخدم" : "User"}
                  </th>
                  <th className="text-start px-4 py-3 font-semibold text-muted-foreground">
                    {isAr ? "المنتج" : "Product"}
                  </th>
                  <th className="text-start px-4 py-3 font-semibold text-muted-foreground">
                    {isAr ? "التقييم" : "Rating"}
                  </th>
                  <th className="text-start px-4 py-3 font-semibold text-muted-foreground">
                    {isAr ? "التعليق" : "Comment"}
                  </th>
                  <th className="text-start px-4 py-3 font-semibold text-muted-foreground">
                    {isAr ? "التاريخ" : "Date"}
                  </th>
                  <th className="text-end px-4 py-3 font-semibold text-muted-foreground">
                    {isAr ? "إجراء" : "Action"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((review) => (
                  <tr key={review.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {review.userName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{review.userName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[150px] truncate">
                      {isAr ? (review.productNameAr ?? "—") : (review.productNameEn ?? "—")}
                    </td>
                    <td className="px-4 py-3">
                      <StarRow rating={review.rating} />
                    </td>
                    <td className="px-4 py-3 max-w-[250px]">
                      {review.comment ? (
                        <p className="text-muted-foreground truncate" title={review.comment}>
                          {review.comment}
                        </p>
                      ) : (
                        <span className="text-muted-foreground/40 italic text-xs">
                          {isAr ? "بدون تعليق" : "No comment"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(review.createdAt).toLocaleDateString(isAr ? "ar-JO" : "en-GB")}
                    </td>
                    <td className="px-4 py-3 text-end">
                      {confirmId === review.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 px-3 text-xs"
                            disabled={deletingId === review.id}
                            onClick={() => handleDelete(review.id)}
                          >
                            {deletingId === review.id
                              ? (isAr ? "جاري..." : "...")
                              : (isAr ? "تأكيد" : "Confirm")}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-3 text-xs"
                            onClick={() => setConfirmId(null)}
                          >
                            {isAr ? "إلغاء" : "Cancel"}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                          onClick={() => setConfirmId(review.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
            {isAr ? `عرض ${filtered.length} من ${reviews.length} تقييم` : `Showing ${filtered.length} of ${reviews.length} reviews`}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-medium text-sm transition-all ${toast.ok ? "bg-green-600" : "bg-destructive"}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
