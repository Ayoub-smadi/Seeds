import { useState } from "react";
import { useGetProducts, useDeleteProduct, useCreateProduct, useUpdateProduct, useGetCategories } from "@workspace/api-client-react";
import { getGetProductsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Plus, Search, Edit, Trash2, Image as ImageIcon } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { useQueryClient } from "@tanstack/react-query";

type FormData = {
  nameAr: string; nameEn: string; descriptionAr: string; descriptionEn: string;
  price: string; salePrice: string; quantity: string; categoryId: string;
  imageUrl: string; onSale: boolean;
};
const emptyForm: FormData = {
  nameAr: "", nameEn: "", descriptionAr: "", descriptionEn: "",
  price: "", salePrice: "", quantity: "", categoryId: "", imageUrl: "", onSale: false,
};

export default function ProductsAdmin() {
  const { t, lang } = useTranslation();
  const qc = useQueryClient();
  const { data, isLoading } = useGetProducts({ limit: 200 });
  const { data: categories } = useGetCategories();
  const deleteMut = useDeleteProduct();
  const createMut = useCreateProduct();
  const updateMut = useUpdateProduct();

  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<null | { mode: 'add' | 'edit'; id?: string; form: FormData }>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const invalidate = () => qc.invalidateQueries({ queryKey: getGetProductsQueryKey() });

  const products = data?.products ?? [];
  const filtered = products.filter(p =>
    p.nameEn?.toLowerCase().includes(search.toLowerCase()) ||
    p.nameAr?.includes(search)
  );

  const openAdd = () => setModal({ mode: 'add', form: { ...emptyForm } });
  const openEdit = (p: any) => setModal({
    mode: 'edit', id: p.id,
    form: {
      nameAr: p.nameAr ?? "", nameEn: p.nameEn ?? "",
      descriptionAr: p.descriptionAr ?? "", descriptionEn: p.descriptionEn ?? "",
      price: String(p.price ?? ""), salePrice: String(p.salePrice ?? ""),
      quantity: String(p.quantity ?? ""), categoryId: p.categoryId ?? "",
      imageUrl: p.images?.[0] ?? "", onSale: !!p.onSale,
    }
  });

  const handleSave = () => {
    if (!modal) return;
    const f = modal.form;
    if (!f.nameAr || !f.nameEn || !f.price) return;
    const payload: any = {
      nameAr: f.nameAr, nameEn: f.nameEn,
      descriptionAr: f.descriptionAr, descriptionEn: f.descriptionEn,
      price: parseFloat(f.price) || 0,
      salePrice: f.salePrice ? parseFloat(f.salePrice) : undefined,
      quantity: parseInt(f.quantity) || 0,
      categoryId: f.categoryId || undefined,
      images: f.imageUrl ? [f.imageUrl] : [],
      onSale: f.onSale,
    };

    if (modal.mode === 'add') {
      createMut.mutate({ data: payload }, {
        onSuccess: () => { invalidate(); setModal(null); showToast(t('created_successfully')); },
        onError: () => showToast(t('error_generic'), false),
      });
    } else {
      updateMut.mutate({ id: modal.id!, data: payload }, {
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
          <h1 className="text-3xl font-bold font-display">{t('products')}</h1>
          <p className="text-muted-foreground mt-1">{lang === 'ar' ? `${data?.total ?? 0} منتج` : `${data?.total ?? 0} products`}</p>
        </div>
        <div className="flex gap-3">
          <Button className="rounded-xl gap-2" onClick={openAdd}>
            <Plus className="w-4 h-4" /> {t('add_product')}
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-4 bg-muted/20">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rtl:left-auto rtl:right-3" />
            <input
              type="text"
              placeholder={t('search_products')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rtl:pr-9 rtl:pl-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground text-sm border-b border-border">
              <th className="px-6 py-4 font-medium">{lang === 'ar' ? 'المنتج' : 'Product'}</th>
              <th className="px-6 py-4 font-medium">{t('price')}</th>
              <th className="px-6 py-4 font-medium">{t('stock')}</th>
              <th className="px-6 py-4 font-medium">{t('status')}</th>
              <th className="px-6 py-4 font-medium text-right">{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</td></tr>
            ) : !filtered.length ? (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">{t('no_products')}</td></tr>
            ) : filtered.map((product) => (
              <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      {product.images?.[0] ? <img src={product.images[0]} className="w-full h-full object-cover" alt="" /> : <ImageIcon className="w-5 h-5 text-muted-foreground" />}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{product.nameEn}</p>
                      <p className="text-xs text-muted-foreground">{product.nameAr}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium">{formatPrice(product.price, 'JOD', lang)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold ${(product.quantity ?? 0) > 10 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {product.quantity} {lang === 'ar' ? 'في المخزن' : 'in stock'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {product.onSale ? <span className="bg-accent/20 text-accent px-2 py-1 rounded text-xs font-bold">{t('on_sale')}</span> : '—'}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-primary" onClick={() => openEdit(product)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setModal(null)}>
          <div className="bg-card rounded-3xl border border-border shadow-2xl w-full max-w-lg p-6 space-y-4 my-8" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold">{modal.mode === 'add' ? t('add_product') : t('edit')}</h2>
            <div className="grid grid-cols-2 gap-4">
              {([
                { key: 'nameEn', label: t('name_en') },
                { key: 'nameAr', label: t('name_ar') },
                { key: 'price', label: t('price'), type: 'number' },
                { key: 'salePrice', label: t('sale_price'), type: 'number' },
                { key: 'quantity', label: t('quantity'), type: 'number' },
              ] as { key: keyof FormData; label: string; type?: string }[]).map(({ key, label, type }) => (
                <div key={key} className="space-y-1">
                  <label className="text-sm font-medium">{label}</label>
                  <input
                    type={type || 'text'}
                    value={modal.form[key] as string}
                    onChange={e => setModal(m => m ? { ...m, form: { ...m.form, [key]: e.target.value } } : m)}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              ))}
              <div className="space-y-1">
                <label className="text-sm font-medium">{t('categories')}</label>
                <select
                  value={modal.form.categoryId}
                  onChange={e => setModal(m => m ? { ...m, form: { ...m.form, categoryId: e.target.value } } : m)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
                >
                  <option value="">{lang === 'ar' ? 'اختر قسم' : 'Select category'}</option>
                  {categories?.map(c => <option key={c.id} value={c.id}>{lang === 'ar' ? c.nameAr : c.nameEn}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t('image_url')}</label>
              <input
                value={modal.form.imageUrl}
                onChange={e => setModal(m => m ? { ...m, form: { ...m.form, imageUrl: e.target.value } } : m)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t('description_en')}</label>
              <textarea
                value={modal.form.descriptionEn}
                onChange={e => setModal(m => m ? { ...m, form: { ...m.form, descriptionEn: e.target.value } } : m)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary resize-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t('description_ar')}</label>
              <textarea
                value={modal.form.descriptionAr}
                onChange={e => setModal(m => m ? { ...m, form: { ...m.form, descriptionAr: e.target.value } } : m)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary resize-none"
                dir="rtl"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={modal.form.onSale}
                onChange={e => setModal(m => m ? { ...m, form: { ...m.form, onSale: e.target.checked } } : m)}
                className="w-4 h-4 rounded accent-primary"
              />
              <span className="text-sm font-medium">{t('on_sale')}</span>
            </label>
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
