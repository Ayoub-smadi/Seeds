import { Link } from "wouter";
import { useTranslation } from "@/lib/i18n";
import { BazourLogo } from "@/components/ui/BazourLogo";
import { useGetSettings } from "@workspace/api-client-react";
import { FaFacebook, FaInstagram, FaXTwitter, FaWhatsapp } from "react-icons/fa6";
import { Mail } from "lucide-react";

export function Footer() {
  const { t } = useTranslation();
  const { data: settings } = useGetSettings();
  const year = new Date().getFullYear();

  const socials = [
    { href: settings?.socialFacebook, icon: FaFacebook, label: "Facebook", color: "hover:text-blue-500" },
    { href: settings?.socialInstagram, icon: FaInstagram, label: "Instagram", color: "hover:text-pink-500" },
    { href: settings?.socialTwitter, icon: FaXTwitter, label: "Twitter / X", color: "hover:text-foreground" },
    { href: settings?.socialWhatsapp, icon: FaWhatsapp, label: "WhatsApp", color: "hover:text-green-500" },
  ].filter(s => s.href);

  return (
    <footer className="bg-card border-t border-border mt-20 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <div className="mb-4">
              <BazourLogo size="sm" href="/" />
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t('hero_subtitle')}
            </p>

            {socials.length > 0 && (
              <div className="flex items-center gap-3 mt-5">
                {socials.map(({ href, icon: Icon, label, color }) => (
                  <a
                    key={label}
                    href={href!}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className={`text-muted-foreground ${color} transition-colors`}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4">{t('shop')}</h4>
            <ul className="space-y-3">
              <li><Link href="/products" className="text-sm text-muted-foreground hover:text-primary transition-colors">{t('all_products')}</Link></li>
              <li><Link href="/products?onSale=true" className="text-sm text-muted-foreground hover:text-primary transition-colors">{t('sale')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">{t('about')}</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">{t('contact')}</a></li>
              {settings?.contactEmail && (
                <li>
                  <a
                    href={`mailto:${settings.contactEmail}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    {settings.contactEmail}
                  </a>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">{t('newsletter')}</h4>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder={t('email')} 
                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                {t('newsletter_submit')}
              </button>
            </div>
          </div>
        </div>
        
        <div className="border-t border-border pt-8 flex justify-center">
          <p className="text-sm text-muted-foreground">
            © {year} بذور Seeds Store. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
}
