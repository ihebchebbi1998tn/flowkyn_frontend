/**
 * @fileoverview Landing page footer with product links,
 * legal links, language switcher, and theme toggle.
 */

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';
import { FLAGS, LANGUAGES } from '@/components/common/LanguageFlags';
import { ROUTES } from '@/constants/routes';
import { getAppUrl } from '@/lib/appMode';
import { FadeIn, HEADING_FONT } from './animations';
import logoImg from '@/assets/logo.png';

export function LandingFooter() {
  const { t, i18n } = useTranslation();
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <FadeIn>
      <footer className="border-t border-border/30">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
          <div className="grid gap-8 grid-cols-2 sm:grid-cols-2 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-5">
                <img src={logoImg} alt="Flowkyn" className="h-12 w-12 object-contain" />
              </div>
              <p className="text-[13px] text-muted-foreground leading-[1.8] max-w-[240px] mb-6">
                {t('landing.footer.description')}
              </p>
              <div className="flex items-center gap-1.5">
                {LANGUAGES.map(lang => {
                  const Flag = FLAGS[lang.code];
                  return (
                    <button key={lang.code} onClick={() => i18n.changeLanguage(lang.code)}
                      className={cn("flex items-center gap-1 px-2.5 py-2 rounded-lg transition-all",
                        i18n.language === lang.code ? 'bg-primary/10 ring-1 ring-primary/20' : 'opacity-40 hover:opacity-80')}>
                      {Flag && <Flag />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-[11px] sm:text-[12px] uppercase tracking-[0.12em] font-bold text-foreground mb-4" style={{ fontFamily: HEADING_FONT }}>
                {t('landing.footer.product')}
              </p>
              <div className="space-y-3">
                <a href="#features" className="block text-[14px] text-muted-foreground hover:text-primary transition-colors">{t('landing.footer.features')}</a>
                <a href="#pricing" className="block text-[14px] text-muted-foreground hover:text-primary transition-colors">Pricing</a>
                <a href={getAppUrl('/games')} className="block text-[14px] text-muted-foreground hover:text-primary transition-colors">{t('landing.footer.activities')}</a>
                <a href="#faq" className="block text-[14px] text-muted-foreground hover:text-primary transition-colors">FAQ</a>
              </div>
            </div>

            <div>
              <p className="text-[11px] sm:text-[12px] uppercase tracking-[0.12em] font-bold text-foreground mb-4" style={{ fontFamily: HEADING_FONT }}>
                {t('landing.footer.company')}
              </p>
              <div className="space-y-3">
                <Link to={ROUTES.ABOUT} className="block text-[14px] text-muted-foreground hover:text-primary transition-colors">{t('landing.footer.about')}</Link>
                <Link to={ROUTES.CONTACT} className="block text-[14px] text-muted-foreground hover:text-primary transition-colors">{t('landing.footer.contact')}</Link>
              </div>
            </div>

            <div>
              <p className="text-[11px] sm:text-[12px] uppercase tracking-[0.12em] font-bold text-foreground mb-4" style={{ fontFamily: HEADING_FONT }}>
                {t('landing.footer.legal')}
              </p>
              <div className="space-y-3">
                <Link to={ROUTES.PRIVACY} className="block text-[14px] text-muted-foreground hover:text-primary transition-colors">{t('landing.footer.privacy')}</Link>
                <Link to={ROUTES.TERMS} className="block text-[14px] text-muted-foreground hover:text-primary transition-colors">{t('landing.footer.terms')}</Link>
                <Link to={ROUTES.SECURITY} className="block text-[14px] text-muted-foreground hover:text-primary transition-colors">{t('landing.footer.security')}</Link>
              </div>
            </div>
          </div>

          <div className="border-t border-border/30 mt-12 pt-7 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[12px] text-muted-foreground/50 font-medium">
              {t('landing.footer.copyright')}
            </p>
            <div className="flex items-center gap-1 rounded-full border border-border/50 bg-muted/30 p-0.5">
              <button onClick={() => setTheme('light')}
                className={cn("flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all",
                  resolvedTheme === 'light' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                <Sun className="h-3 w-3" /> {t('theme.light')}
              </button>
              <button onClick={() => setTheme('dark')}
                className={cn("flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all",
                  resolvedTheme === 'dark' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                <Moon className="h-3 w-3" /> {t('theme.dark')}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </FadeIn>
  );
}
