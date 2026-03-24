import { useState, useRef } from "react";
import { useGetProducts, useDeleteProduct, useCreateProduct, useUpdateProduct, useGetCategories } from "@workspace/api-client-react";
import { getGetProductsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Plus, Search, Edit, Trash2, Image as ImageIcon, Upload, Download, X, FileText, CheckCircle, AlertCircle, AlignLeft } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { useQueryClient } from "@tanstack/react-query";
import { ImageUpload } from "@/components/admin/ImageUpload";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

type FormData = {
  nameAr: string; nameEn: string; descriptionAr: string; descriptionEn: string;
  price: string; salePrice: string; quantity: string; categoryId: string;
  imageUrl: string; onSale: boolean;
};
const emptyForm: FormData = {
  nameAr: "", nameEn: "", descriptionAr: "", descriptionEn: "",
  price: "", salePrice: "", quantity: "", categoryId: "", imageUrl: "", onSale: false,
};

const CSV_COLUMNS = [
  "nameAr", "nameEn", "descriptionAr", "descriptionEn",
  "price", "salePrice", "quantity", "sku", "featured", "onSale", "category", "images",
];

const CSV_EXAMPLE = `nameAr,nameEn,descriptionAr,descriptionEn,price,salePrice,quantity,sku,featured,onSale,category,images
بذور طماطم,Tomato Seeds,بذور طماطم عضوية عالية الجودة,High quality organic tomato seeds,5.99,,100,TOM001,false,false,,tomato.jpg
بذور فلفل,Pepper Seeds,بذور فلفل حلو للزراعة المنزلية,Sweet pepper seeds for home gardening,4.50,3.99,80,PEP001,true,true,,pepper1.jpg|pepper2.jpg`;

function downloadTemplate() {
  const blob = new Blob([CSV_EXAMPLE], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "products-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

type ImportResult = { imported: number; failed: number; errors: string[] } | null;

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
  const [importOpen, setImportOpen] = useState(false);
  const [importTab, setImportTab] = useState<'csv' | 'text'>('text');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult>(null);
  const [textInput, setTextInput] = useState("");
  const [textImporting, setTextImporting] = useState(false);
  const [textResult, setTextResult] = useState<ImportResult>(null);
  const csvRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
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

  const handleImport = async () => {
    if (!csvFile) return;
    setImporting(true);
    setImportResult(null);
    try {
      const token = localStorage.getItem("bazour_token");
      const fd = new FormData();
      fd.append("file", csvFile);
      const res = await fetch(`${BASE}/api/upload/bulk`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const json = await res.json();
      setImportResult(json);
      if (json.imported > 0) invalidate();
    } catch {
      setImportResult({ imported: 0, failed: 1, errors: [lang === 'ar' ? 'فشل الاتصال بالسيرفر' : 'Failed to connect to server'] });
    } finally {
      setImporting(false);
    }
  };

  // Text import: each line = nameAr / nameEn / price / quantity / descriptionAr / descriptionEn
  const handleTextImport = async () => {
    const lines = textInput.split("\n").map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;
    setTextImporting(true);
    setTextResult(null);
    let imported = 0;
    const errors: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split("/").map(p => p.trim());
      const [nameAr, nameEn, price, quantity, descriptionAr, descriptionEn] = parts;
      if (!nameAr || !nameEn || !price) {
        errors.push(lang === 'ar' ? `السطر ${i + 1}: الاسم والسعر مطلوبان` : `Line ${i + 1}: name and price are required`);
        continue;
      }
      try {
        await new Promise<void>((resolve, reject) => {
          createMut.mutate({
            data: {
              nameAr,
              nameEn,
              price: parseFloat(price) || 0,
              quantity: parseInt(quantity ?? "0") || 0,
              descriptionAr: descriptionAr || undefined,
              descriptionEn: descriptionEn || undefined,
              images: [],
              onSale: false,
            }
          }, { onSuccess: () => resolve(), onError: () => reject() });
        });
        imported++;
      } catch {
        errors.push(lang === 'ar' ? `السطر ${i + 1}: فشل الإضافة` : `Line ${i + 1}: failed to add`);
      }
    }
    setTextResult({ imported, failed: errors.length, errors });
    if (imported > 0) invalidate();
    setTextImporting(false);
  };

  const resetImport = () => {
    setCsvFile(null);
    setImportResult(null);
    setTextInput("");
    setTextResult(null);
    if (csvRef.current) csvRef.current.value = "";
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
          <Button variant="outline" className="rounded-xl gap-2" onClick={() => { setImportOpen(true); resetImport(); }}>
            <Upload className="w-4 h-4" />
            {lang === 'ar' ? 'استيراد CSV' : 'Import CSV'}
          </Button>
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

      {/* ── Import Modal ── */}
      {importOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setImportOpen(false)}>
          <div className="bg-card rounded-3xl border border-border shadow-2xl w-full max-w-2xl p-6 space-y-5 my-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{lang === 'ar' ? 'استيراد منتجات' : 'Bulk Import Products'}</h2>
              <button onClick={() => setImportOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-muted rounded-2xl">
              <button
                onClick={() => { setImportTab('text'); setImportResult(null); setTextResult(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-semibold transition-all ${importTab === 'text' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <AlignLeft className="w-4 h-4" />
                {lang === 'ar' ? 'استيراد نصي' : 'Text Import'}
              </button>
              <button
                onClick={() => { setImportTab('csv'); setImportResult(null); setTextResult(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-semibold transition-all ${importTab === 'csv' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <FileText className="w-4 h-4" />
                {lang === 'ar' ? 'استيراد CSV' : 'CSV Import'}
              </button>
            </div>

            {/* ── Text Import Tab ── */}
            {importTab === 'text' && (
              <div className="space-y-4">
                <div className="bg-muted/40 rounded-2xl p-4 space-y-2">
                  <p className="text-sm font-semibold text-foreground">
                    {lang === 'ar' ? 'التنسيق: كل سطر = منتج واحد' : 'Format: one line = one product'}
                  </p>
                  <code className="block text-xs bg-background rounded-xl px-3 py-2 font-mono text-muted-foreground border border-border">
                    {lang === 'ar'
                      ? 'الاسم عربي / English Name / السعر / الكمية / وصف عربي / English description'
                      : 'Arabic Name / English Name / price / quantity / Arabic desc / English desc'}
                  </code>
                  <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'مثال:' : 'Example:'}</p>
                  <code className="block text-xs bg-background rounded-xl px-3 py-2 font-mono text-primary border border-border whitespace-pre-wrap">{`بذور طماطم / Tomato Seeds / 3.99 / 50 / بذور طماطم عضوية / Organic tomato seeds
بذور ورد / Rose Seeds / 5.99 / 30 / بذور ورد جميلة / Beautiful rose seeds
بذور فلفل / Pepper Seeds / 4.50 / 80`}</code>
                  <p className="text-xs text-muted-foreground">{lang === 'ar' ? '* الاسم والسعر مطلوبان — الباقي اختياري' : '* Name and price are required — rest optional'}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">{lang === 'ar' ? 'الصق المنتجات هنا:' : 'Paste your products here:'}</label>
                  <textarea
                    value={textInput}
                    onChange={e => { setTextInput(e.target.value); setTextResult(null); }}
                    rows={7}
                    placeholder={lang === 'ar' ? 'بذور طماطم / Tomato Seeds / 3.99 / 50\nبذور ورد / Rose Seeds / 5.99 / 30' : 'بذور طماطم / Tomato Seeds / 3.99 / 50\nبذور ورد / Rose Seeds / 5.99 / 30'}
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:border-primary resize-none font-mono"
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground">
                    {textInput.split("\n").filter(l => l.trim()).length} {lang === 'ar' ? 'منتج جاهز للاستيراد' : 'product(s) ready to import'}
                  </p>
                </div>

                {textResult && (
                  <div className={`rounded-2xl p-4 space-y-2 ${textResult.failed === 0 ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'}`}>
                    <div className="flex items-center gap-2 font-semibold text-sm">
                      {textResult.failed === 0 ? <CheckCircle className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-amber-600" />}
                      <span>{lang === 'ar' ? `تم إضافة ${textResult.imported} منتج — فشل ${textResult.failed}` : `Added ${textResult.imported} products — ${textResult.failed} failed`}</span>
                    </div>
                    {textResult.errors.length > 0 && (
                      <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                        {textResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button className="flex-1 rounded-xl gap-2" onClick={handleTextImport} disabled={!textInput.trim() || textImporting}>
                    {textImporting ? (lang === 'ar' ? 'جاري الإضافة...' : 'Adding...') : (lang === 'ar' ? 'أضف المنتجات' : 'Add Products')}
                  </Button>
                  <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setImportOpen(false)}>{t('cancel')}</Button>
                </div>
              </div>
            )}

            {/* ── CSV Import Tab ── */}
            {importTab === 'csv' && (
              <div className="space-y-4">
                <div className="bg-muted/40 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      {lang === 'ar' ? 'تنسيق الملف (الأعمدة)' : 'File Format (columns)'}
                    </p>
                    <Button variant="outline" size="sm" className="rounded-xl gap-1 text-xs" onClick={downloadTemplate}>
                      <Download className="w-3.5 h-3.5" />
                      {lang === 'ar' ? 'تحميل مثال' : 'Download Template'}
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="text-xs w-full border-collapse">
                      <thead>
                        <tr className="bg-muted">
                          {CSV_COLUMNS.map(c => (
                            <th key={c} className="px-2 py-1.5 text-left font-mono font-semibold border border-border/50 whitespace-nowrap">{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="px-2 py-1 border border-border/30 text-muted-foreground font-mono">بذور طماطم</td>
                          <td className="px-2 py-1 border border-border/30 text-muted-foreground font-mono">Tomato Seeds</td>
                          <td className="px-2 py-1 border border-border/30 text-muted-foreground font-mono">وصف...</td>
                          <td className="px-2 py-1 border border-border/30 text-muted-foreground font-mono">Desc...</td>
                          <td className="px-2 py-1 border border-border/30 text-muted-foreground font-mono">5.99</td>
                          <td className="px-2 py-1 border border-border/30 text-muted-foreground font-mono">3.99</td>
                          <td className="px-2 py-1 border border-border/30 text-muted-foreground font-mono">100</td>
                          <td className="px-2 py-1 border border-border/30 text-muted-foreground font-mono">TOM001</td>
                          <td className="px-2 py-1 border border-border/30 text-muted-foreground font-mono">false</td>
                          <td className="px-2 py-1 border border-border/30 text-muted-foreground font-mono">true</td>
                          <td className="px-2 py-1 border border-border/30 text-muted-foreground font-mono">vegetables</td>
                          <td className="px-2 py-1 border border-border/30 text-muted-foreground font-mono">-</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">{lang === 'ar' ? 'ارفع ملف CSV' : 'Upload CSV file'}</label>
                  <div
                    className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-colors ${csvFile ? 'border-primary/60 bg-primary/5' : 'border-border hover:border-primary/40'}`}
                    onClick={() => csvRef.current?.click()}
                  >
                    <input ref={csvRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
                      onChange={e => { setCsvFile(e.target.files?.[0] ?? null); setImportResult(null); }} />
                    {csvFile ? (
                      <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
                        <FileText className="w-4 h-4" /> {csvFile.name}
                        <button className="text-muted-foreground hover:text-destructive ml-1" onClick={e => { e.stopPropagation(); setCsvFile(null); setImportResult(null); if (csvRef.current) csvRef.current.value = ""; }}>
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">{lang === 'ar' ? 'اضغط لاختيار ملف CSV أو Excel' : 'Click to select CSV or Excel file'}</p>
                    )}
                  </div>
                </div>

                {importResult && (
                  <div className={`rounded-2xl p-4 space-y-2 ${importResult.failed === 0 ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'}`}>
                    <div className="flex items-center gap-2 font-semibold text-sm">
                      {importResult.failed === 0 ? <CheckCircle className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-amber-600" />}
                      <span>{lang === 'ar' ? `تم استيراد ${importResult.imported} منتج — فشل ${importResult.failed}` : `Imported ${importResult.imported} — ${importResult.failed} failed`}</span>
                    </div>
                    {importResult.errors.length > 0 && (
                      <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                        {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button className="flex-1 rounded-xl gap-2" onClick={handleImport} disabled={!csvFile || importing}>
                    {importing ? (lang === 'ar' ? 'جاري الاستيراد...' : 'Importing...') : (lang === 'ar' ? 'ابدأ الاستيراد' : 'Start Import')}
                  </Button>
                  <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setImportOpen(false)}>{t('cancel')}</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
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
            <ImageUpload
              label={lang === 'ar' ? 'صورة المنتج' : 'Product image'}
              value={modal.form.imageUrl}
              onChange={url => setModal(m => m ? { ...m, form: { ...m.form, imageUrl: url } } : m)}
            />
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
