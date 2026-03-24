import { useState } from "react";
import { useGetCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, FolderTree, ChevronDown } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useQueryClient } from "@tanstack/react-query";
import { getGetCategoriesQueryKey } from "@workspace/api-client-react";
import { ImageUpload } from "@/components/admin/ImageUpload";

type FormData = { nameAr: string; nameEn: string; slug: string; imageUrl: string; parentId: string };
const empty: FormData = { nameAr: "", nameEn: "", slug: "", imageUrl: "", parentId: "" };

export default function CategoriesAdmin() {
  const { t, lang } = useTranslation();
  const qc = useQueryClient();
  const { data: categories, isLoading } = useGetCategories();
  const createMut = useCreateCategory();
  const updateMut = useUpdateCategory();
  const deleteMut = useDeleteCategory();

  const [modal, setModal] = useState<null | { mode: 'add' | 'edit'; id?: string; form: FormData }>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const invalidate = () => qc.invalidateQueries({ queryKey: getGetCategoriesQueryKey() });

  const allFlat = [
    ...(categories ?? []),
    ...((categories ?? []).flatMap(c => c.subcategories ?? [])),
  ];

  const openAdd = () => setModal({ mode: 'add', form: { ...empty } });
  const openEdit = (cat: any) => setModal({
    mode: 'edit', id: cat.id,
    form: {
      nameAr: cat.nameAr, nameEn: cat.nameEn, slug: cat.slug || "",
      imageUrl: cat.imageUrl || "", parentId: cat.parentId || ""
    }
  });

  const autoSlug = (nameEn: string) =>
    nameEn.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const handleSave = () => {
    if (!modal) return;
    const { nameAr, nameEn, slug, imageUrl, parentId } = modal.form;
    if (!nameAr || !nameEn || !slug) return;
    const data = { nameAr, nameEn, slug, imageUrl, parentId: parentId || undefined };

    if (modal.mode === 'add') {
      createMut.mutate({ data }, {
        onSuccess: () => { invalidate(); setModal(null); showToast(t('created_successfully')); },
        onError: () => showToast(t('error_generic'), false),
      });
    } else {
      updateMut.mutate({ id: modal.id!, data }, {
        onSuccess: () => { invalidate(); setModal(null); showToast(t('updated_successfully')); },
        onError: () => showToast(t('error_generic'), false),
      });
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm(t('delete') + "?")) return;
    deleteMut.mutate({ id }, {
      onSuccess: () => { invalidate(); showToast(t('deleted_successfully')); },
      onError: () => showToast(t('error_generic'), false),
    });
  };

  const parentCategories = (categories ?? []).filter(c => !c.parentId);

  return (
    <div className="space-y-8">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-white font-medium ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex justify-between items-center bg-card p-6 rounded-3xl border border-border shadow-sm">
        <div>
          <h1 className="text-3xl font-bold font-display">{t('categories')}</h1>
          <p className="text-muted-foreground mt-1">{lang === 'ar' ? 'إدارة أقسام ومجموعات المتجر' : 'Manage store categories & subcategories'}</p>
        </div>
        <Button className="rounded-xl gap-2" onClick={openAdd}>
          <Plus className="w-4 h-4" /> {t('add_category')}
        </Button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground">{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>
      ) : !categories?.length ? (
        <div className="p-8 text-center text-muted-foreground">{t('no_categories')}</div>
      ) : (
        <div className="space-y-6">
          {parentCategories.map(parent => (
            <div key={parent.id} className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
              {/* Parent Category Header */}
              <div className="flex items-center gap-4 p-5 border-b border-border">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-muted flex-shrink-0">
                  {parent.imageUrl ? (
                    <img src={parent.imageUrl} alt={lang === 'ar' ? parent.nameAr : parent.nameEn} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FolderTree className="w-6 h-6 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-lg">{lang === 'ar' ? parent.nameAr : parent.nameEn}</p>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                      {lang === 'ar' ? 'قسم رئيسي' : 'Main'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{lang === 'ar' ? parent.nameEn : parent.nameAr}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {parent.productCount || 0} {lang === 'ar' ? 'منتج' : 'products'} •
                    {(parent.subcategories?.length ?? 0)} {lang === 'ar' ? ' مجموعة فرعية' : ' subcategories'}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:text-primary" onClick={() => openEdit(parent)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(parent.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Subcategories */}
              {(parent.subcategories?.length ?? 0) > 0 && (
                <div className="divide-y divide-border">
                  {parent.subcategories!.map(sub => (
                    <div key={sub.id} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors">
                      <div className="w-1 h-8 rounded-full bg-primary/20 ms-4 flex-shrink-0" />
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                        {sub.imageUrl ? (
                          <img src={sub.imageUrl} alt={lang === 'ar' ? sub.nameAr : sub.nameEn} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FolderTree className="w-4 h-4 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{lang === 'ar' ? sub.nameAr : sub.nameEn}</p>
                        <p className="text-xs text-muted-foreground">{sub.productCount || 0} {lang === 'ar' ? 'منتج' : 'products'}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-primary" onClick={() => openEdit(sub)}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(sub.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add subcategory shortcut */}
              <div className="px-5 py-3 border-t border-border/50">
                <button
                  onClick={() => setModal({ mode: 'add', form: { ...empty, parentId: parent.id } })}
                  className="text-xs text-muted-foreground hover:text-primary font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {lang === 'ar' ? `أضف مجموعة فرعية لـ "${parent.nameAr}"` : `Add subcategory under "${parent.nameEn}"`}
                </button>
              </div>
            </div>
          ))}

          {/* Orphan subcategories (parentId points to non-existent parent) */}
          {allFlat.filter(c => c.parentId && !parentCategories.find(p => p.id === c.parentId)).map(cat => (
            <div key={cat.id} className="bg-card rounded-3xl border border-border shadow-sm p-5 flex items-center gap-4">
              <div className="flex-1">
                <p className="font-bold">{lang === 'ar' ? cat.nameAr : cat.nameEn}</p>
                <p className="text-xs text-muted-foreground">{cat.productCount || 0} {lang === 'ar' ? 'منتج' : 'products'}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-primary" onClick={() => openEdit(cat)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(cat.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-card rounded-3xl border border-border shadow-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold">{modal.mode === 'add' ? t('add_category') : t('edit')}</h2>

            <div className="space-y-1">
              <label className="text-sm font-medium">{t('name_ar')}</label>
              <input
                value={modal.form.nameAr}
                onChange={e => setModal(m => m ? { ...m, form: { ...m.form, nameAr: e.target.value } } : m)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
                dir="rtl"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">{t('name_en')}</label>
              <input
                value={modal.form.nameEn}
                onChange={e => {
                  const nameEn = e.target.value;
                  setModal(m => m ? {
                    ...m,
                    form: {
                      ...m.form,
                      nameEn,
                      slug: m.form.slug || autoSlug(nameEn),
                    }
                  } : m);
                }}
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">{t('slug')}</label>
              <input
                value={modal.form.slug}
                onChange={e => setModal(m => m ? { ...m, form: { ...m.form, slug: e.target.value } } : m)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary font-mono"
                placeholder="e.g. vegetables"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">{lang === 'ar' ? 'القسم الرئيسي (اختياري)' : 'Parent Category (optional)'}</label>
              <div className="relative">
                <select
                  value={modal.form.parentId}
                  onChange={e => setModal(m => m ? { ...m, form: { ...m.form, parentId: e.target.value } } : m)}
                  className="w-full h-10 px-3 pe-8 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary appearance-none"
                  disabled={modal.mode === 'edit' && !!modal.id && parentCategories.some(p => p.id === modal.id)}
                >
                  <option value="">{lang === 'ar' ? '— قسم رئيسي —' : '— Main category —'}</option>
                  {parentCategories
                    .filter(p => p.id !== modal.id)
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {lang === 'ar' ? p.nameAr : p.nameEn}
                      </option>
                    ))}
                </select>
                <ChevronDown className="absolute end-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
              {modal.mode === 'edit' && modal.id && parentCategories.some(p => p.id === modal.id) && (
                <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'القسم الرئيسي لا يمكن تحويله لقسم فرعي إذا له أقسام فرعية' : 'Cannot set parent on a category that has subcategories'}</p>
              )}
            </div>

            <ImageUpload
              label={lang === 'ar' ? 'صورة القسم' : 'Category image'}
              value={modal.form.imageUrl}
              onChange={url => setModal(m => m ? { ...m, form: { ...m.form, imageUrl: url } } : m)}
            />

            <div className="flex gap-3 pt-2">
              <Button className="flex-1 rounded-xl" onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>
                {t('save')}
              </Button>
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setModal(null)}>
                {t('cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
