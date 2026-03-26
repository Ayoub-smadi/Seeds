import { useState } from "react";
import { useGetCurrentUser } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { KeyRound, Mail, Save, Eye, EyeOff } from "lucide-react";

export default function AdminProfile() {
  const { lang } = useTranslation();
  const isAr = lang === "ar";
  const { data: user } = useGetCurrentUser();

  const [emailForm, setEmailForm] = useState({ email: "" });
  const [passForm, setPassForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const getToken = () => localStorage.getItem("bazour_token") || "";

  const handleUpdateEmail = async () => {
    if (!emailForm.email) {
      showToast(isAr ? "أدخل الإيميل الجديد" : "Enter new email", false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/update-credentials", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ email: emailForm.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error");
      if (data.token) localStorage.setItem("bazour_token", data.token);
      showToast(isAr ? "تم تحديث الإيميل بنجاح" : "Email updated successfully");
      setEmailForm({ email: "" });
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : (isAr ? "حدث خطأ" : "Error"), false);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!passForm.currentPassword || !passForm.newPassword) {
      showToast(isAr ? "أدخل جميع الحقول" : "Fill all fields", false);
      return;
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      showToast(isAr ? "كلمتا السر غير متطابقتين" : "Passwords do not match", false);
      return;
    }
    if (passForm.newPassword.length < 6) {
      showToast(isAr ? "كلمة السر يجب أن تكون 6 أحرف على الأقل" : "Password must be at least 6 characters", false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/update-credentials", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ currentPassword: passForm.currentPassword, newPassword: passForm.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error");
      if (data.token) localStorage.setItem("bazour_token", data.token);
      showToast(isAr ? "تم تحديث كلمة السر بنجاح" : "Password updated successfully");
      setPassForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : (isAr ? "حدث خطأ" : "Error"), false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-white font-medium ${toast.ok ? "bg-green-600" : "bg-red-600"}`}>
          {toast.msg}
        </div>
      )}

      <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
        <h1 className="text-3xl font-bold font-display">{isAr ? "إعدادات الحساب" : "Account Settings"}</h1>
        <p className="text-muted-foreground mt-1">
          {isAr ? "تغيير إيميل أو كلمة سر حساب الأدمن" : "Change admin account email or password"}
        </p>
        {user && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-medium">
            <Mail className="w-4 h-4" />
            {isAr ? "الحساب الحالي:" : "Current account:"} <span className="font-bold">{user.email}</span>
          </div>
        )}
      </div>

      {/* Change Email */}
      <div className="bg-card rounded-3xl border border-border shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{isAr ? "تغيير الإيميل" : "Change Email"}</h2>
            <p className="text-sm text-muted-foreground">{isAr ? "أدخل الإيميل الجديد" : "Enter the new email address"}</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">{isAr ? "الإيميل الجديد" : "New Email"}</label>
          <input
            type="email"
            value={emailForm.email}
            onChange={e => setEmailForm({ email: e.target.value })}
            placeholder={isAr ? "أدخل الإيميل الجديد..." : "Enter new email..."}
            className="w-full h-11 px-4 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <Button onClick={handleUpdateEmail} disabled={loading} className="rounded-xl gap-2">
          <Save className="w-4 h-4" /> {isAr ? "حفظ الإيميل" : "Save Email"}
        </Button>
      </div>

      {/* Change Password */}
      <div className="bg-card rounded-3xl border border-border shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{isAr ? "تغيير كلمة السر" : "Change Password"}</h2>
            <p className="text-sm text-muted-foreground">{isAr ? "تأكد من أن كلمة السر قوية" : "Make sure to use a strong password"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold">{isAr ? "كلمة السر الحالية" : "Current Password"}</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={passForm.currentPassword}
                onChange={e => setPassForm(f => ({ ...f, currentPassword: e.target.value }))}
                placeholder="••••••••"
                className="w-full h-11 px-4 pr-11 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors"
              />
              <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">{isAr ? "كلمة السر الجديدة" : "New Password"}</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={passForm.newPassword}
                onChange={e => setPassForm(f => ({ ...f, newPassword: e.target.value }))}
                placeholder="••••••••"
                className="w-full h-11 px-4 pr-11 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors"
              />
              <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold">{isAr ? "تأكيد كلمة السر الجديدة" : "Confirm New Password"}</label>
            <input
              type="password"
              value={passForm.confirmPassword}
              onChange={e => setPassForm(f => ({ ...f, confirmPassword: e.target.value }))}
              placeholder="••••••••"
              className="w-full h-11 px-4 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <Button onClick={handleUpdatePassword} disabled={loading} className="rounded-xl gap-2">
          <KeyRound className="w-4 h-4" /> {isAr ? "تحديث كلمة السر" : "Update Password"}
        </Button>
      </div>
    </div>
  );
}
