import { useState, useEffect, useRef } from "react";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { useQueryClient } from "@tanstack/react-query";
import { getGetSettingsQueryKey } from "@workspace/api-client-react";
import { Save, Mail, Send, Eye, EyeOff, CheckCircle, XCircle, Loader2 } from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

const SMTP_PASS_MASK = "__SET__";

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
    socialWhatsapp: "",
  });

  const [smtpForm, setSmtpForm] = useState({
    smtpHost: "",
    smtpPort: "587",
    smtpUser: "",
    smtpPass: "",
    smtpFromName: "",
    smtpFromEmail: "",
  });

  const smtpPassWasSet = useRef(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [testMsg, setTestMsg] = useState("");

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
        socialWhatsapp: settings.socialWhatsapp ?? "",
      });

      const passSet = (settings as any).smtpPass === SMTP_PASS_MASK;
      smtpPassWasSet.current = passSet;
      setSmtpForm({
        smtpHost: (settings as any).smtpHost ?? "",
        smtpPort: (settings as any).smtpPort ?? "587",
        smtpUser: (settings as any).smtpUser ?? "",
        smtpPass: passSet ? "" : "",
        smtpFromName: (settings as any).smtpFromName ?? "",
        smtpFromEmail: (settings as any).smtpFromEmail ?? "",
      });
      if ((settings as any).smtpUser) {
        setTestEmail((settings as any).smtpUser);
      }
    }
  }, [settings]);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSave = () => {
    const smtpData: Record<string, string> = {
      smtpHost: smtpForm.smtpHost,
      smtpPort: smtpForm.smtpPort,
      smtpUser: smtpForm.smtpUser,
      smtpFromName: smtpForm.smtpFromName,
      smtpFromEmail: smtpForm.smtpFromEmail,
    };
    if (smtpForm.smtpPass) {
      smtpData.smtpPass = smtpForm.smtpPass;
    }

    updateMut.mutate({ data: { ...form, ...smtpData } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
        if (smtpForm.smtpPass) {
          smtpPassWasSet.current = true;
          setSmtpForm(f => ({ ...f, smtpPass: "" }));
        }
        showToast(t('updated_successfully'));
      },
      onError: () => showToast(t('error_generic'), false),
    });
  };

  const handleTestEmail = async () => {
    setTestStatus("loading");
    setTestMsg("");
    try {
      const token = localStorage.getItem("bazour_token");
      const res = await fetch(`${BASE}/api/settings/test-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ toEmail: testEmail || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestStatus("success");
        setTestMsg(data.message || "تم إرسال الإيميل بنجاح!");
      } else {
        setTestStatus("error");
        setTestMsg(data.error || "فشل إرسال الإيميل");
      }
    } catch (err: any) {
      setTestStatus("error");
      setTestMsg(err?.message || "خطأ في الاتصال");
    }
    setTimeout(() => setTestStatus("idle"), 6000);
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
    { key: 'socialWhatsapp', label: lang === 'ar' ? 'رابط واتساب' : 'WhatsApp URL', placeholder: 'https://wa.me/962...' },
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

      {/* SMTP Email Settings */}
      <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 p-6 border-b border-border bg-muted/30">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{lang === 'ar' ? 'إعدادات البريد الإلكتروني (SMTP)' : 'Email Settings (SMTP)'}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {lang === 'ar'
                ? 'اضبط إعدادات الإيميل لإرسال تأكيدات الطلبات والإشعارات'
                : 'Configure email settings for order confirmations and notifications'}
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                {lang === 'ar' ? 'خادم SMTP (Host)' : 'SMTP Host'}
              </label>
              <input
                value={smtpForm.smtpHost}
                onChange={e => setSmtpForm(f => ({ ...f, smtpHost: e.target.value }))}
                placeholder="smtp.gmail.com"
                className="w-full h-11 px-4 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                {lang === 'ar' ? 'المنفذ (Port)' : 'Port'}
              </label>
              <select
                value={smtpForm.smtpPort}
                onChange={e => setSmtpForm(f => ({ ...f, smtpPort: e.target.value }))}
                className="w-full h-11 px-4 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors"
              >
                <option value="587">587 — TLS (مستحسن)</option>
                <option value="465">465 — SSL</option>
                <option value="25">25 — بدون تشفير</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                {lang === 'ar' ? 'اسم المستخدم / الإيميل' : 'SMTP Username / Email'}
              </label>
              <input
                value={smtpForm.smtpUser}
                onChange={e => setSmtpForm(f => ({ ...f, smtpUser: e.target.value }))}
                placeholder="your@gmail.com"
                type="email"
                className="w-full h-11 px-4 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                {lang === 'ar' ? 'كلمة المرور / App Password' : 'Password / App Password'}
                {smtpPassWasSet.current && !smtpForm.smtpPass && (
                  <span className="text-xs font-normal text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                    {lang === 'ar' ? '✓ محفوظة' : '✓ Saved'}
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  value={smtpForm.smtpPass}
                  onChange={e => setSmtpForm(f => ({ ...f, smtpPass: e.target.value }))}
                  placeholder={smtpPassWasSet.current ? (lang === 'ar' ? 'اتركها فارغة للإبقاء على القديمة' : 'Leave empty to keep existing') : 'App password...'}
                  type={showSmtpPass ? "text" : "password"}
                  className="w-full h-11 px-4 pr-11 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowSmtpPass(v => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showSmtpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                {lang === 'ar' ? 'اسم المرسل' : 'From Name'}
              </label>
              <input
                value={smtpForm.smtpFromName}
                onChange={e => setSmtpForm(f => ({ ...f, smtpFromName: e.target.value }))}
                placeholder="بذور Seeds Store"
                className="w-full h-11 px-4 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                {lang === 'ar' ? 'إيميل المرسل' : 'From Email'}
              </label>
              <input
                value={smtpForm.smtpFromEmail}
                onChange={e => setSmtpForm(f => ({ ...f, smtpFromEmail: e.target.value }))}
                placeholder="noreply@bazour.jo"
                type="email"
                className="w-full h-11 px-4 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Gmail tip */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
            <strong>💡 {lang === 'ar' ? 'تلميح جوجل:' : 'Gmail Tip:'}</strong>{' '}
            {lang === 'ar'
              ? 'لو بتستخدم Gmail، لازم تستخدم "App Password" وليس كلمة مرور حسابك العادية. فعّل المصادقة الثنائية أولاً ثم أنشئ App Password من إعدادات حساب جوجل.'
              : 'If using Gmail, you must use an "App Password", not your regular password. Enable 2-Step Verification first, then create an App Password from your Google Account settings.'}
          </div>

          {/* Test Email Section */}
          <div className="border-t border-border pt-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" />
              {lang === 'ar' ? 'اختبار الإيميل' : 'Test Email'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {lang === 'ar'
                ? 'احفظ الإعدادات أولاً ثم اضغط "إرسال اختبار" للتحقق من أن الإيميل يعمل صح'
                : 'Save settings first, then click "Send Test" to verify email is working correctly'}
            </p>
            <div className="flex gap-3 items-center flex-wrap">
              <input
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                placeholder={lang === 'ar' ? 'إيميل الاختبار...' : 'Test recipient email...'}
                type="email"
                className="flex-1 min-w-48 h-11 px-4 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors"
              />
              <Button
                onClick={handleTestEmail}
                disabled={testStatus === "loading"}
                variant="outline"
                className="rounded-xl gap-2 h-11 px-5"
              >
                {testStatus === "loading" ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {lang === 'ar' ? 'جاري الإرسال...' : 'Sending...'}</>
                ) : (
                  <><Send className="w-4 h-4" /> {lang === 'ar' ? 'إرسال اختبار' : 'Send Test'}</>
                )}
              </Button>
            </div>

            {testStatus !== "idle" && testStatus !== "loading" && (
              <div className={`mt-3 flex items-start gap-2 text-sm rounded-xl px-4 py-3 ${
                testStatus === "success"
                  ? "bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
              }`}>
                {testStatus === "success"
                  ? <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  : <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                <span>{testMsg}</span>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button className="rounded-xl gap-2 px-8" onClick={handleSave} disabled={updateMut.isPending}>
              <Save className="w-4 h-4" />
              {updateMut.isPending
                ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                : (lang === 'ar' ? 'حفظ إعدادات SMTP' : 'Save SMTP Settings')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
