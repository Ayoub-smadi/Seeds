import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { Plus, Pencil, Trash2, Eye, EyeOff, PlusCircle, X, Image as ImageIcon } from "lucide-react";
import { ImageUpload } from "@/components/admin/ImageUpload";

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

const EMPTY_FORM = {
  titleAr: "", titleEn: "", slug: "",
  excerptAr: "", excerptEn: "", coverImage: "",
  sections: [] as Section[], published: false,
};

function authHeader() {
  const token = localStorage.getItem("bazour_token");
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

export default function ArticlesAdmin() {
  const { lang } = useTranslation();
  const isAr = lang === "ar";
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Article | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = () => {
    setLoading(true);
    fetch(`${BASE}/api/articles`, { headers: authHeader() })
      .then(r => r.json())
      .then(data => setArticles(Array.isArray(data) ? data : []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (a: Article) => {
    setEditing(a);
    setForm({
      titleAr: a.titleAr, titleEn: a.titleEn, slug: a.slug,
      excerptAr: a.excerptAr || "", excerptEn: a.excerptEn || "",
      coverImage: a.coverImage || "",
      sections: a.sections as Section[],
      published: a.published,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.titleAr || !form.titleEn || !form.slug) {
      showToast(isAr ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields", false);
      return;
    }
    setSaving(true);
    try {
      const url = editing ? `${BASE}/api/articles/${editing.id}` : `${BASE}/api/articles`;
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: authHeader(), body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      showToast(editing ? (isAr ? "تم التحديث" : "Updated") : (isAr ? "تم الإنشاء" : "Created"));
      setShowForm(false);
      load();
    } catch {
      showToast(isAr ? "حدث خطأ" : "Something went wrong", false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${BASE}/api/articles/${id}`, { method: "DELETE", headers: authHeader() });
      showToast(isAr ? "تم الحذف" : "Deleted");
      load();
    } catch {
      showToast(isAr ? "حدث خطأ" : "Something went wrong", false);
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const togglePublish = async (a: Article) => {
    try {
      await fetch(`${BASE}/api/articles/${a.id}`, {
        method: "PUT",
        headers: authHeader(),
        body: JSON.stringify({ ...a, published: !a.published }),
      });
      load();
    } catch {}
  };

  const addSection = (type: "text" | "image") => {
    const newSection: Section = type === "text"
      ? { type: "text", contentAr: "", contentEn: "" }
      : { type: "image", imageUrl: "", caption: "" };
    setForm(f => ({ ...f, sections: [...f.sections, newSection] }));
  };

  const updateSection = (i: number, patch: Partial<Section>) => {
    setForm(f => ({
      ...f,
      sections: f.sections.map((s, idx) => idx === i ? { ...s, ...patch } : s),
    }));
  };

  const removeSection = (i: number) => {
    setForm(f => ({ ...f, sections: f.sections.filter((_, idx) => idx !== i) }));
  };

  const autoSlug = (titleEn: string) =>
    titleEn.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return (
    <div className="space-y-8">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-white font-medium ${toast.ok ? "bg-green-600" : "bg-red-600"}`}>
          {toast.msg}
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4 space-y-4">
            <h3 className="text-lg font-bold">{isAr ? "تأكيد الحذف" : "Confirm Delete"}</h3>
            <p className="text-muted-foreground text-sm">{isAr ? "هل أنت متأكد أنك تريد حذف هذا المقال؟" : "Are you sure you want to delete this article?"}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDeleteId(null)} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors">{isAr ? "إلغاء" : "Cancel"}</button>
              <button onClick={() => handleDelete(confirmDeleteId)} className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium">{isAr ? "حذف" : "Delete"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center bg-card p-6 rounded-3xl border border-border shadow-sm">
        <div>
          <h1 className="text-3xl font-bold font-display">{isAr ? "المقالات" : "Articles"}</h1>
          <p className="text-muted-foreground mt-1">{articles.length} {isAr ? "مقال" : "articles"}</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {isAr ? "مقال جديد" : "New Article"}
        </button>
      </div>

      {/* List */}
      <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">{isAr ? "جاري التحميل..." : "Loading..."}</div>
        ) : articles.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <p>{isAr ? "لا توجد مقالات بعد." : "No articles yet."}</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground text-sm border-b border-border">
                <th className="px-6 py-4 font-medium text-start">{isAr ? "العنوان" : "Title"}</th>
                <th className="px-6 py-4 font-medium text-start">{isAr ? "الرابط" : "Slug"}</th>
                <th className="px-6 py-4 font-medium text-start">{isAr ? "التاريخ" : "Date"}</th>
                <th className="px-6 py-4 font-medium text-start">{isAr ? "الحالة" : "Status"}</th>
                <th className="px-6 py-4 font-medium text-start"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {articles.map(a => (
                <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium">{isAr ? a.titleAr : a.titleEn}</p>
                    {(isAr ? a.excerptAr : a.excerptEn) && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{isAr ? a.excerptAr : a.excerptEn}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground font-mono">{a.slug}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(a.createdAt).toLocaleDateString(isAr ? "ar-JO" : "en-GB")}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => togglePublish(a)}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${a.published ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"}`}
                    >
                      {a.published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {a.published ? (isAr ? "منشور" : "Published") : (isAr ? "مسودة" : "Draft")}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(a)} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setConfirmDeleteId(a.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
          <div className="min-h-screen flex items-start justify-center py-8 px-4">
            <div className="bg-card rounded-3xl shadow-2xl w-full max-w-3xl border border-border">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-xl font-bold">{editing ? (isAr ? "تعديل المقال" : "Edit Article") : (isAr ? "مقال جديد" : "New Article")}</h2>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                {/* Basic info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{isAr ? "العنوان بالعربي *" : "Title (Arabic) *"}</label>
                    <input value={form.titleAr} onChange={e => setForm(f => ({ ...f, titleAr: e.target.value }))}
                      className="w-full border border-border rounded-xl px-4 py-2.5 bg-background text-sm focus:outline-none focus:border-primary" dir="rtl" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{isAr ? "العنوان بالإنجليزي *" : "Title (English) *"}</label>
                    <input value={form.titleEn} onChange={e => {
                      const v = e.target.value;
                      setForm(f => ({ ...f, titleEn: v, slug: editing ? f.slug : autoSlug(v) }));
                    }}
                      className="w-full border border-border rounded-xl px-4 py-2.5 bg-background text-sm focus:outline-none focus:border-primary" dir="ltr" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{isAr ? "الرابط المختصر *" : "Slug *"}</label>
                  <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                    className="w-full border border-border rounded-xl px-4 py-2.5 bg-background text-sm focus:outline-none focus:border-primary font-mono" dir="ltr" placeholder="my-article-slug" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{isAr ? "مقتطف عربي" : "Excerpt (Arabic)"}</label>
                    <textarea value={form.excerptAr} onChange={e => setForm(f => ({ ...f, excerptAr: e.target.value }))}
                      rows={2} className="w-full border border-border rounded-xl px-4 py-2.5 bg-background text-sm focus:outline-none focus:border-primary resize-none" dir="rtl" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{isAr ? "مقتطف إنجليزي" : "Excerpt (English)"}</label>
                    <textarea value={form.excerptEn} onChange={e => setForm(f => ({ ...f, excerptEn: e.target.value }))}
                      rows={2} className="w-full border border-border rounded-xl px-4 py-2.5 bg-background text-sm focus:outline-none focus:border-primary resize-none" dir="ltr" />
                  </div>
                </div>

                <ImageUpload value={form.coverImage} onChange={v => setForm(f => ({ ...f, coverImage: v }))} label={isAr ? "صورة الغلاف" : "Cover Image"} />

                {/* Sections */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{isAr ? "محتوى المقال" : "Article Content"}</h3>
                    <div className="flex gap-2">
                      <button onClick={() => addSection("text")} className="flex items-center gap-1.5 text-xs bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-lg transition-colors">
                        <PlusCircle className="w-3.5 h-3.5" />{isAr ? "فقرة نص" : "Add Text"}
                      </button>
                      <button onClick={() => addSection("image")} className="flex items-center gap-1.5 text-xs bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-lg transition-colors">
                        <ImageIcon className="w-3.5 h-3.5" />{isAr ? "صورة" : "Add Image"}
                      </button>
                    </div>
                  </div>

                  {form.sections.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">{isAr ? "أضف فقرات أو صور للمقال" : "Add text paragraphs or images to the article"}</p>
                  )}

                  {form.sections.map((section, i) => (
                    <div key={i} className="border border-border rounded-xl p-4 space-y-3 relative">
                      <button onClick={() => removeSection(i)} className="absolute top-3 end-3 p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-destructive">
                        <X className="w-4 h-4" />
                      </button>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {section.type === "text" ? (isAr ? "فقرة نص" : "Text Paragraph") : (isAr ? "صورة" : "Image")}
                      </div>
                      {section.type === "text" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">{isAr ? "النص بالعربي" : "Text (Arabic)"}</label>
                            <textarea value={section.contentAr || ""} onChange={e => updateSection(i, { contentAr: e.target.value })}
                              rows={4} dir="rtl" className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:border-primary resize-none" />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">{isAr ? "النص بالإنجليزي" : "Text (English)"}</label>
                            <textarea value={section.contentEn || ""} onChange={e => updateSection(i, { contentEn: e.target.value })}
                              rows={4} dir="ltr" className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:border-primary resize-none" />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <ImageUpload value={section.imageUrl || ""} onChange={v => updateSection(i, { imageUrl: v })} />
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">{isAr ? "وصف الصورة (اختياري)" : "Caption (optional)"}</label>
                            <input value={section.caption || ""} onChange={e => updateSection(i, { caption: e.target.value })}
                              className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:border-primary" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Published */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className={`relative w-11 h-6 rounded-full transition-colors ${form.published ? "bg-primary" : "bg-muted"}`}
                    onClick={() => setForm(f => ({ ...f, published: !f.published }))}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.published ? "translate-x-5" : ""}`} />
                  </div>
                  <span className="text-sm font-medium">{isAr ? "نشر المقال" : "Publish Article"}</span>
                </label>
              </div>

              <div className="flex gap-3 justify-end p-6 border-t border-border">
                <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl border border-border text-sm hover:bg-muted transition-colors">{isAr ? "إلغاء" : "Cancel"}</button>
                <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {saving ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ" : "Save")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
