/**
 * @fileoverview Landing page sticky navbar with language switcher,
 * login/register CTAs, and responsive mobile menu.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ChevronDown, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { FLAGS, LANGUAGES } from '@/components/common/LanguageFlags';
import { ROUTES } from '@/constants/routes';
import { getAppUrl } from '@/lib/appMode';
import logoImg from '@/assets/logo.png';

export function LandingNavbar() {
  const { t, i18n } = useTranslation();
  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '#features', label: t('landing.nav.features') },
    { href: '#how-it-works', label: t('landing.nav.howItWorks') },
    { href: '#pricing', label: 'Pricing' },
    { href: '#faq', label: 'FAQ' },
    { href: '#contact', label: t('static.contact.title', 'Contact') },
  ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-2xl"
    >
      <div className="mx-auto max-w-[1200px] flex items-center justify-between h-[56px] sm:h-[64px] px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6 lg:gap-8">
          <Link to={ROUTES.HOME} className="flex items-center gap-2">
            <motion.img src={logoImg} alt="Flowkyn" className="h-9 w-9 sm:h-10 sm:w-10 object-contain"
              whileHover={{ rotate: 8, scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            />
          </Link>
          <div className="hidden md:flex items-center gap-7">
            {navLinks.map(link => (
              <a key={link.href} href={link.href}
                className="text-[13.5px] text-muted-foreground hover:text-foreground transition-colors font-medium">
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Desktop actions */}
        <div className="hidden sm:flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2 gap-1.5">
                {(() => { const Flag = FLAGS[currentLang.code]; return Flag ? <Flag /> : null; })()}
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {LANGUAGES.map((lang) => {
                const Flag = FLAGS[lang.code];
                return (
                  <DropdownMenuItem key={lang.code} onClick={() => i18n.changeLanguage(lang.code)}
                    className={cn("text-[13px] gap-2", i18n.language === lang.code && 'bg-accent font-medium')}>
                    {Flag && <Flag />}
                    {lang.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <a href={getAppUrl('/login')}>
            <Button variant="ghost" size="sm" className="h-9 text-[13.5px] text-muted-foreground font-medium">
              {t('landing.nav.login')}
            </Button>
          </a>
          <a href={getAppUrl('/register')}>
            <Button size="sm" className="h-9 text-[13.5px] gap-1.5 px-5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all font-semibold">
              {t('landing.nav.getStarted')}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </a>
        </div>

        {/* Mobile hamburger */}
        <button className="sm:hidden p-2 -mr-2 text-muted-foreground hover:text-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="sm:hidden border-t border-border/40 bg-background overflow-hidden">
            <div className="px-4 pb-4 pt-3 space-y-3">
              <div className="flex flex-col gap-1">
                {navLinks.map(link => (
                  <a key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}
                    className="text-[14px] text-muted-foreground hover:text-foreground py-2">{link.label}</a>
                ))}
              </div>
              <div className="border-t border-border/40 pt-3 flex flex-col gap-2">
                <a href={getAppUrl('/login')} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full h-10 text-[14px] rounded-full">{t('landing.nav.login')}</Button>
                </a>
                <a href={getAppUrl('/register')} onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full h-10 text-[14px] gap-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                    {t('landing.nav.getStarted')} <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
