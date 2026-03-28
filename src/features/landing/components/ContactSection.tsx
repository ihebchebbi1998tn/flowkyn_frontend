/**
 * @fileoverview Contact form section with success animation and
 * direct email link.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Send, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FadeUp, HEADING_FONT } from './animations';

export function ContactSection() {
  const { t } = useTranslation();
  const [contactSent, setContactSent] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (contactForm.name.trim() && contactForm.email.trim() && contactForm.message.trim()) {
      try {
        const { contactApi } = await import('@/api/contact');
        await contactApi.submit({
          name: contactForm.name.trim(),
          email: contactForm.email.trim(),
          subject: contactForm.subject.trim(),
          message: contactForm.message.trim(),
        });
      } catch {
        // Still show success to user (message may be queued)
      }
      setContactSent(true);
    }
  };

  return (
    <section id="contact" className="border-t border-border/30 bg-muted/20 relative overflow-hidden">
      <motion.div className="absolute top-[20%] right-[-100px] w-[400px] h-[400px] rounded-full blur-[120px]"
        style={{ background: 'hsl(var(--primary) / 0.04)' }}
        animate={{ scale: [1, 1.2, 1], x: [0, -30, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />

      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-16 sm:py-24 md:py-32 relative">
        <FadeUp className="text-center mb-12 sm:mb-16">
          <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.12em] font-semibold text-primary mb-4 block">
            {t('static.contact.sectionLabel')}
          </span>
          <h2 className="text-[26px] sm:text-[34px] md:text-[44px] font-extrabold tracking-[-0.025em]" style={{ fontFamily: HEADING_FONT }}>
            {t('static.contact.sectionTitle')}{' '}
            <span className="brand-gradient-text">{t('static.contact.sectionTitleHighlight')}</span>
          </h2>
          <p className="text-[15px] sm:text-[17px] text-muted-foreground max-w-[500px] mx-auto mt-3 leading-relaxed">
            {t('static.contact.sectionSubtitle')}
          </p>
        </FadeUp>

        <div className="max-w-[680px] mx-auto">
          <FadeUp delay={0.1} className="mb-8">
            <motion.div className="flex items-center justify-center gap-3 rounded-xl border border-border/50 bg-card px-5 py-3.5"
              whileHover={{ scale: 1.01, borderColor: 'hsl(var(--primary) / 0.3)' }} transition={{ duration: 0.2 }}>
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-[13px] text-muted-foreground">{t('static.contact.orReachUs')}:</span>
              <a href="mailto:contact@flowkyn.com" className="text-[13px] font-semibold text-primary hover:underline">contact@flowkyn.com</a>
            </motion.div>
          </FadeUp>

          <FadeUp delay={0.2}>
            <AnimatePresence mode="wait">
              {contactSent ? (
                <motion.div key="success"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-2xl border border-primary/20 bg-primary/5 p-10 sm:p-14 text-center">
                  <motion.div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-6"
                    initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 12 }}>
                    <Check className="h-7 w-7 text-primary" />
                  </motion.div>
                  <motion.p className="text-[18px] font-bold mb-2" style={{ fontFamily: HEADING_FONT }}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                    {t('static.contact.successMessage')}
                  </motion.p>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                    <Button variant="outline" size="sm" className="mt-5 text-[13px] rounded-full"
                      onClick={() => { setContactSent(false); setContactForm({ name: '', email: '', subject: '', message: '' }); }}>
                      {t('common.back')}
                    </Button>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.form key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.4 }}
                  onSubmit={handleSubmit}
                  className="rounded-2xl border border-border/50 bg-card p-6 sm:p-8 space-y-5 hover:border-primary/15 transition-colors duration-300">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-semibold">{t('static.contact.nameLabel')}</Label>
                      <Input required maxLength={100} value={contactForm.name}
                        onChange={(e) => setContactForm(f => ({ ...f, name: e.target.value }))}
                        placeholder={t('static.contact.namePlaceholder')}
                        className="h-11 text-[14px] rounded-xl transition-all focus:shadow-md focus:shadow-primary/10" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-semibold">{t('static.contact.emailLabel')}</Label>
                      <Input required type="email" maxLength={255} value={contactForm.email}
                        onChange={(e) => setContactForm(f => ({ ...f, email: e.target.value }))}
                        placeholder={t('static.contact.emailPlaceholder')}
                        className="h-11 text-[14px] rounded-xl transition-all focus:shadow-md focus:shadow-primary/10" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-semibold">{t('static.contact.subjectLabel')}</Label>
                    <Input maxLength={200} value={contactForm.subject}
                      onChange={(e) => setContactForm(f => ({ ...f, subject: e.target.value }))}
                      placeholder={t('static.contact.subjectPlaceholder')}
                      className="h-11 text-[14px] rounded-xl transition-all focus:shadow-md focus:shadow-primary/10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-semibold">{t('static.contact.messageLabel')}</Label>
                    <Textarea required maxLength={1000} value={contactForm.message}
                      onChange={(e) => setContactForm(f => ({ ...f, message: e.target.value }))}
                      placeholder={t('static.contact.messagePlaceholder')}
                      className="min-h-[140px] text-[14px] rounded-xl resize-none transition-all focus:shadow-md focus:shadow-primary/10" />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Button type="submit" className="h-11 px-8 text-[14px] gap-2 font-bold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
                        {t('static.contact.sendButton')}
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    </motion.div>
                    <p className="hidden sm:block text-[11px] text-muted-foreground/40 font-medium">contact@flowkyn.com</p>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
