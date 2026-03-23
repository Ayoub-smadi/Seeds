import { useState } from "react";
import { useGetCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, FolderTree } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useQueryClient } from "@tanstack/react-query";
import { getGetCategoriesQueryKey } from "@workspace/api-client-react";

type FormData = { nameAr: string; nameEn: string; slug: string; imageUrl: string };
const empty: FormData = { nameAr: "", nameEn: "", slug: "", imageUrl: "" };

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

  const openAdd = () => setModal({ mode: 'add', form: { ...empty } });
  const openEdit = (cat: any) => setModal({
    mode: 'edit', id: cat.id,
    form: { nameAr: cat.nameAr, nameEn: cat.nameEn, slug: cat.slug || "", imageUrl: cat.imageUrl || "" }
  });

  const handleSave = () => {
    if (!modal) return;
    const { nameAr, nameEn, slug } = modal.form;
    if (!nameAr || !nameEn || !slug) return;

    if (modal.mode === 'add') {
      createMut.mutate({ data: modal.form }, {
        onSuccess: () => { invalidate(); setModal(null); showToast(t('created_successfully')); },
        onError: () => showToast(t('error_generic'), false),
      });
    } else {
      updateMut.mutate({ id: modal.id!, data: modal.form }, {
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
          <p className="text-muted-foreground mt-1">{lang === 'ar' ? 'إدارة أقسام المتجر' : 'Manage store categories'}</p>
        </div>
        <Button className="rounded-xl gap-2" onClick={openAdd}>
          <Plus className="w-4 h-4" /> {t('add_category')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-3 p-8 text-center text-muted-foreground">{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>
        ) : !categories?.length ? (
          <div className="col-span-3 p-8 text-center text-muted-foreground">{t('no_categories')}</div>
        ) : categories.map((cat) => (
          <div key={cat.id} className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden group">
            <div className="aspect-video bg-muted relative overflow-hidden">
              {cat.imageUrl ? (
                <img src={cat.imageUrl} alt={lang === 'ar' ? cat.nameAr : cat.nameEn} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FolderTree className="w-12 h-12 text-muted-foreground/30" />
                </div>
              )}
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-bold">{cat.nameEn}</p>
                <p className="text-sm text-muted-foreground">{cat.nameAr}</p>
                <p className="text-xs text-muted-foreground mt-1">{cat.productCount || 0} {lang === 'ar' ? 'منتج' : 'products'}</p>
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
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-card rounded-3xl border border-border shadow-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold">{modal.mode === 'add' ? t('add_category') : t('edit')}</h2>
            {([
              { key: 'nameAr', label: t('name_ar') },
              { key: 'nameEn', label: t('name_en') },
              { key: 'slug', label: t('slug') },
              { key: 'imageUrl', label: t('image_url') },
            ] as { key: keyof FormData; label: string }[]).map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <label className="text-sm font-medium">{label}</label>
                <input
                  value={modal.form[key]}
                  onChange={e => setModal(m => m ? { ...m, form: { ...m.form, [key]: e.target.value } } : m)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
                />
              </div>
            ))}
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
