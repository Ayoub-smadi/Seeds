import { useRef, useState } from "react";
import { Upload, X, Image as ImageIcon, Plus } from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
const MAX_SIZE_MB = 20;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

interface MultiImageUploadProps {
  values: string[];
  onChange: (urls: string[]) => void;
  onUploadingChange?: (isUploading: boolean) => void;
  max?: number;
  label?: string;
}

export function MultiImageUpload({ values, onChange, onUploadingChange, max = 2, label }: MultiImageUploadProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [uploading, setUploading] = useState<boolean[]>([]);
  const [errors, setErrors] = useState<(string | null)[]>([]);

  const slots = Array.from({ length: max }, (_, i) => i);

  const setError = (idx: number, msg: string | null) => {
    setErrors(prev => {
      const next = [...prev];
      next[idx] = msg;
      return next;
    });
  };

  const setUploadingSlot = (idx: number, val: boolean) => {
    setUploading(prev => {
      const next = [...prev];
      next[idx] = val;
      const anyUploading = next.some(Boolean);
      onUploadingChange?.(anyUploading);
      return next;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(idx, null);

    if (file.size > MAX_SIZE_BYTES) {
      setError(idx, `حجم الملف كبير جداً، الحد الأقصى ${MAX_SIZE_MB}MB`);
      if (inputRefs.current[idx]) inputRefs.current[idx]!.value = "";
      return;
    }

    setUploadingSlot(idx, true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = localStorage.getItem("bazour_token");
      const res = await fetch(`${BASE}/api/upload/image`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        let message = "فشل الرفع / Upload failed";
        try {
          const body = await res.json();
          if (body?.message) message = body.message;
        } catch {}
        setError(idx, message);
        return;
      }
      const data = await res.json();
      const next = [...values];
      next[idx] = data.url;
      onChange(next.filter((_, i) => i < max));
    } catch {
      setError(idx, "فشل الرفع / Upload failed");
    } finally {
      setUploadingSlot(idx, false);
      if (inputRefs.current[idx]) inputRefs.current[idx]!.value = "";
    }
  };

  const removeImage = (idx: number) => {
    const next = [...values];
    next[idx] = "";
    const cleaned = next.map(v => v ?? "");
    onChange(cleaned);
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <div className="grid grid-cols-2 gap-3">
        {slots.map((idx) => {
          const value = values[idx] ?? "";
          const isUploading = uploading[idx] ?? false;
          const error = errors[idx] ?? null;

          return (
            <div key={idx} className="space-y-1">
              <p className="text-xs text-muted-foreground">
                {idx === 0 ? "الصورة الرئيسية" : `صورة ${idx + 1}`}
              </p>
              <div
                className="relative w-full h-36 rounded-xl border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all overflow-hidden"
                onClick={() => !isUploading && inputRefs.current[idx]?.click()}
              >
                {value ? (
                  <>
                    <img src={value} alt="" className="w-full h-full object-cover absolute inset-0" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-medium">تغيير الصورة</span>
                    </div>
                    <button
                      type="button"
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center z-10 hover:bg-black/80"
                      onClick={e => { e.stopPropagation(); removeImage(idx); }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-muted-foreground">جاري الرفع...</span>
                  </div>
                ) : (
                  <>
                    {idx === 0 ? (
                      <ImageIcon className="w-7 h-7 text-muted-foreground/50" />
                    ) : (
                      <Plus className="w-7 h-7 text-muted-foreground/50" />
                    )}
                    <span className="text-[10px] text-muted-foreground text-center px-3">
                      {idx === 0 ? "انقر لرفع الصورة الرئيسية" : "انقر لإضافة صورة ثانية"}
                      <br />
                      <span className="text-muted-foreground/60">JPG, PNG, WEBP — حتى {MAX_SIZE_MB}MB</span>
                    </span>
                    <Upload className="w-4 h-4 text-primary/60" />
                  </>
                )}
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <input
                ref={el => { inputRefs.current[idx] = el; }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => handleFileChange(e, idx)}
                disabled={isUploading}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
