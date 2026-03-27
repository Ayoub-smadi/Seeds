import { useState } from "react";
import { useGetShippingZones, useCreateShippingZone, useUpdateShippingZone, useDeleteShippingZone } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Truck } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useQueryClient } from "@tanstack/react-query";
import { getGetShippingZonesQueryKey } from "@workspace/api-client-react";
import { useCurrency } from "@/lib/useCurrency";
import { formatPrice } from "@/lib/utils";

type FormData = { nameAr: string; nameEn: string; price: string; estimatedDays: string };
const empty: FormData = { nameAr: "", nameEn: "", price: "", estimatedDays: "" };

export default function ShippingAdmin() {
  const { t, lang } = useTranslation();
  const qc = useQueryClient();
  const { data: zones, isLoading } = useGetShippingZones();
  const createMut = useCreateShippingZone();
  const updateMut = useUpdateShippingZone();
  const deleteMut = useDeleteShippingZone();

  const [modal, setModal] = useState<null | { mode: 'add' | 'edit'; id?: string; form: FormData }>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const invalidate = () => qc.invalidateQueries({ queryKey: getGetShippingZonesQueryKey() });

  const openAdd = () => setModal({ mode: 'add', form: { ...empty } });
  const openEdit = (zone: any) => setModal({
    mode: 'edit', id: zone.id,
    form: { nameAr: zone.nameAr, nameEn: zone.nameEn, price: String(zone.price), estimatedDays: String(zone.estimatedDays ?? "") }
  });

  const handleSave = () => {
    if (!modal) return;
    const payload = {
      nameAr: modal.form.nameAr,
      nameEn: modal.form.nameEn,
      price: parseFloat(modal.form.price) || 0,
      estimatedDays: parseInt(modal.form.estimatedDays) || undefined,
    };
    if (!payload.nameAr || !payload.nameEn) return;

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
          <h1 className="text-3xl font-bold font-display">{t('shipping_zones')}</h1>
          <p className="text-muted-foreground mt-1">{lang === 'ar' ? 'إدارة مناطق الشحن والأسعار' : 'Manage shipping zones and prices'}</p>
        </div>
        <Button className="rounded-xl gap-2" onClick={openAdd}>
          <Plus className="w-4 h-4" /> {t('add_zone')}
        </Button>
      </div>

      <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground text-sm border-b border-border">
              <th className="px-6 py-4 font-medium">{t('name_en')}</th>
              <th className="px-6 py-4 font-medium">{t('name_ar')}</th>
              <th className="px-6 py-4 font-medium">{t('price')}</th>
              <th className="px-6 py-4 font-medium">{t('estimated_days')}</th>
              <th className="px-6 py-4 font-medium text-right">{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</td></tr>
            ) : !zones?.length ? (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">{t('no_zones')}</td></tr>
            ) : zones.map((zone) => (
              <tr key={zone.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-6 py-4 font-medium">{zone.nameEn}</td>
                <td className="px-6 py-4 text-muted-foreground">{zone.nameAr}</td>
                <td className="px-6 py-4 font-bold text-primary">{formatPrice(zone.price, 'JOD', lang)}</td>
                <td className="px-6 py-4 text-muted-foreground">
                  {zone.estimatedDays ? `${zone.estimatedDays} ${lang === 'ar' ? 'أيام' : 'days'}` : '—'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-primary" onClick={() => openEdit(zone)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(zone.id)}>
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-card rounded-3xl border border-border shadow-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold">{modal.mode === 'add' ? t('add_zone') : t('edit')}</h2>
            {([
              { key: 'nameAr', label: t('name_ar') },
              { key: 'nameEn', label: t('name_en') },
              { key: 'price', label: t('price'), type: 'number' },
              { key: 'estimatedDays', label: t('estimated_days'), type: 'number' },
            ] as { key: keyof FormData; label: string; type?: string }[]).map(({ key, label, type }) => (
              <div key={key} className="space-y-1">
                <label className="text-sm font-medium">{label}</label>
                <input
                  type={type || 'text'}
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
