import { useRef, useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export function ImageUpload({ value, onChange, label }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = localStorage.getItem("bazour_token");
      const res = await fetch(`${BASE}/api/upload/image`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      onChange(data.url);
    } catch {
      setError("فشل الرفع / Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <div
        className="relative w-full h-36 rounded-xl border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all overflow-hidden"
        onClick={() => !uploading && inputRef.current?.click()}
      >
        {value ? (
          <>
            <img src={value} alt="" className="w-full h-full object-cover absolute inset-0" />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <span className="text-white text-sm font-medium">تغيير الصورة / Change</span>
            </div>
            <button
              type="button"
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center z-10 hover:bg-black/80"
              onClick={e => { e.stopPropagation(); onChange(""); }}
            >
              <X className="w-3 h-3" />
            </button>
          </>
        ) : uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-muted-foreground">جاري الرفع...</span>
          </div>
        ) : (
          <>
            <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
            <span className="text-xs text-muted-foreground text-center px-4">
              انقر لرفع صورة<br />
              <span className="text-[10px] text-muted-foreground/70">JPG, PNG, WEBP — حتى 10MB</span>
            </span>
            <Upload className="w-4 h-4 text-primary/60" />
          </>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />
    </div>
  );
}
