import { Link } from "wouter";
import { useTranslation } from "@/lib/i18n";
import { BazourLogo } from "@/components/ui/BazourLogo";

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

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
        
        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {t('copyright').replace('{year}', String(year))}
          </p>
        </div>
      </div>
    </footer>
  );
}
