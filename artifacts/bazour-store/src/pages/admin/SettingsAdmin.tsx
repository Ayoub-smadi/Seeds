import { useState, useEffect } from "react";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { useQueryClient } from "@tanstack/react-query";
import { getGetSettingsQueryKey } from "@workspace/api-client-react";
import { Save } from "lucide-react";

export default function SettingsAdmin() {
  const { t, lang } = useTranslation();
  const qc = useQueryClient();
  const { data: settings, isLoading } = useGetSettings();
  const updateMut = useUpdateSettings();
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [form, setForm] = useState({
    storeName: "",
    storeNameAr: "",
    contactEmail: "",
    contactPhone: "",
    footerText: "",
    footerTextAr: "",
    currency: "",
    currencySymbol: "",
    socialFacebook: "",
    socialInstagram: "",
    socialTwitter: "",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        storeName: settings.storeName ?? "",
        storeNameAr: settings.storeNameAr ?? "",
        contactEmail: settings.contactEmail ?? "",
        contactPhone: settings.contactPhone ?? "",
        footerText: settings.footerText ?? "",
        footerTextAr: settings.footerTextAr ?? "",
        currency: settings.currency ?? "",
        currencySymbol: settings.currencySymbol ?? "",
        socialFacebook: settings.socialFacebook ?? "",
        socialInstagram: settings.socialInstagram ?? "",
        socialTwitter: settings.socialTwitter ?? "",
      });
    }
  }, [settings]);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = () => {
    updateMut.mutate({ data: form }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
        showToast(t('updated_successfully'));
      },
      onError: () => showToast(t('error_generic'), false),
    });
  };

  const fields: { key: keyof typeof form; label: string; placeholder?: string }[] = [
    { key: 'storeName', label: t('store_name') + ' (EN)', placeholder: 'Bazour Seeds' },
    { key: 'storeNameAr', label: t('store_name') + ' (AR)', placeholder: 'بذور' },
    { key: 'contactEmail', label: t('contact_email'), placeholder: 'info@bazour.jo' },
    { key: 'contactPhone', label: t('contact_phone'), placeholder: '+962 7...' },
    { key: 'footerText', label: t('footer_text') + ' (EN)', placeholder: 'All rights reserved' },
    { key: 'footerTextAr', label: t('footer_text') + ' (AR)', placeholder: 'جميع الحقوق محفوظة' },
    { key: 'currency', label: t('currency'), placeholder: 'JOD' },
    { key: 'currencySymbol', label: t('currency_symbol'), placeholder: 'د.أ' },
    { key: 'socialFacebook', label: t('social_facebook'), placeholder: 'https://facebook.com/...' },
    { key: 'socialInstagram', label: t('social_instagram'), placeholder: 'https://instagram.com/...' },
    { key: 'socialTwitter', label: 'Twitter / X URL', placeholder: 'https://x.com/...' },
  ];

  if (isLoading) {
    return <div className="p-12 text-center text-muted-foreground">{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>;
  }

  return (
    <div className="space-y-8">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-white font-medium ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex justify-between items-center bg-card p-6 rounded-3xl border border-border shadow-sm">
        <div>
          <h1 className="text-3xl font-bold font-display">{t('store_settings')}</h1>
          <p className="text-muted-foreground mt-1">{lang === 'ar' ? 'إعدادات المتجر العامة' : 'General store configuration'}</p>
        </div>
        <Button className="rounded-xl gap-2" onClick={handleSave} disabled={updateMut.isPending}>
          <Save className="w-4 h-4" /> {t('save')}
        </Button>
      </div>

      <div className="bg-card rounded-3xl border border-border shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-2">
              <label className="text-sm font-semibold text-foreground">{label}</label>
              <input
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full h-11 px-4 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-border flex justify-end">
          <Button className="rounded-xl gap-2 px-8" onClick={handleSave} disabled={updateMut.isPending}>
            <Save className="w-4 h-4" />
            {updateMut.isPending ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : t('save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
