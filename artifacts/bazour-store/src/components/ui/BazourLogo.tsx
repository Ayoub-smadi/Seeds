import { Link } from "wouter";
import { useAppStore } from "@/lib/store";

interface BazourLogoProps {
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
}

export function BazourLogo({ size = "md", href = "/", className = "" }: BazourLogoProps) {
  const { lang } = useAppStore();

  const sizes = {
    sm: { icon: 28, ar: "text-lg", en: "text-[9px]", gap: "gap-1.5" },
    md: { icon: 38, ar: "text-2xl", en: "text-[10px]", gap: "gap-2" },
    lg: { icon: 52, ar: "text-3xl", en: "text-sm", gap: "gap-3" },
  };

  const s = sizes[size];

  const logo = (
    <div className={`flex items-center ${s.gap} ${className}`}>
      <LogoMark size={s.icon} />
      <div className="flex flex-col leading-none">
        <span
          className={`font-bold tracking-wide text-primary ${s.ar}`}
          style={{ fontFamily: "system-ui, 'Segoe UI', sans-serif" }}
        >
          بذور
        </span>
        <span
          className={`font-semibold tracking-[0.18em] uppercase text-muted-foreground ${s.en}`}
          style={{ fontFamily: "system-ui, 'Segoe UI', sans-serif" }}
        >
          Bazour
        </span>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{logo}</Link>;
  }

  return logo;
}

function LogoMark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Bazour Logo"
    >
      <circle cx="24" cy="24" r="23" fill="currentColor" className="text-primary/10" />

      <path
        d="M24 38 C24 38 24 24 24 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-primary"
      />

      <path
        d="M24 26 C20 26 13 22 14 14 C14 14 22 14 24 22"
        fill="currentColor"
        className="text-primary"
        opacity="0.85"
      />

      <path
        d="M24 22 C28 22 35 18 34 10 C34 10 26 10 24 18"
        fill="currentColor"
        className="text-primary"
      />

      <ellipse
        cx="24"
        cy="38"
        rx="5"
        ry="2.5"
        fill="currentColor"
        className="text-primary/20"
      />

      <circle cx="19" cy="38" r="2" fill="currentColor" className="text-primary/40" />
      <circle cx="29" cy="38" r="2" fill="currentColor" className="text-primary/40" />
      <circle cx="24" cy="40" r="1.5" fill="currentColor" className="text-primary/30" />
    </svg>
  );
}
