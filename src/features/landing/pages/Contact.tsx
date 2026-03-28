import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Mail, Send, Check, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/constants/routes';
import { toast } from 'sonner';
import { trackEvent, TRACK } from '@/hooks/useTracker';
import logoImg from '@/assets/logo.png';

export default function Contact() {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    setSubmitting(true);
    try {
      const { contactApi } = await import('@/api/contact');
      await contactApi.submit({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      trackEvent(TRACK.CONTACT_SUBMITTED, { subject: form.subject });
      setSent(true);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border">
        <div className="mx-auto max-w-3xl flex items-center justify-between h-14 px-6">
          <Link to={ROUTES.HOME} className="flex items-center gap-2">
            <img src={logoImg} alt="Flowkyn" className="h-7 w-7 object-contain" />
            <span className="text-[15px] font-bold tracking-tight">Flowkyn</span>
          </Link>
          <Link to={ROUTES.HOME}>
            <Button variant="ghost" size="sm" className="text-[13px] gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              {t('common.back')}
            </Button>
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-[32px] font-bold tracking-tight mb-2">{t('static.contact.title')}</h1>
          <p className="text-[15px] text-muted-foreground mb-10">{t('static.contact.subtitle')}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex items-center gap-3 rounded-xl border border-border/50 bg-card px-5 py-3.5 mb-10">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Mail className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-[13px] text-muted-foreground">{t('static.contact.emailLabel')}:</span>
          <a href="mailto:contact@flowkyn.com" className="text-[13px] font-semibold text-primary hover:underline">contact@flowkyn.com</a>
        </motion.div>

        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-primary/20 bg-primary/5 p-10 text-center"
            >
              <motion.div
                className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-5"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 12 }}
              >
                <Check className="h-7 w-7 text-primary" />
              </motion.div>
              <p className="text-[16px] font-semibold mb-2">{t('static.contact.successMessage')}</p>
              <Button variant="outline" size="sm" className="mt-4 text-[13px]"
                onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}>
                {t('common.back')}
              </Button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[13px]">{t('static.contact.nameLabel')}</Label>
                  <Input required maxLength={100} value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder={t('static.contact.namePlaceholder')} className="h-10 transition-all focus:shadow-md focus:shadow-primary/10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px]">{t('static.contact.emailLabel')}</Label>
                  <Input required type="email" maxLength={255} value={form.email}
                    onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder={t('static.contact.emailPlaceholder')} className="h-10 transition-all focus:shadow-md focus:shadow-primary/10" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px]">{t('static.contact.subjectLabel')}</Label>
                <Input maxLength={200} value={form.subject}
                  onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder={t('static.contact.subjectPlaceholder')} className="h-10 transition-all focus:shadow-md focus:shadow-primary/10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px]">{t('static.contact.messageLabel')}</Label>
                <Textarea required maxLength={1000} value={form.message}
                  onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder={t('static.contact.messagePlaceholder')} className="min-h-[130px] resize-none transition-all focus:shadow-md focus:shadow-primary/10" />
              </div>
              <Button type="submit" disabled={submitting} className="h-10 px-6 text-[13px] gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 rounded-xl">
                {submitting ? 'Sending...' : t('static.contact.sendButton')}
                {!submitting && <Send className="h-3.5 w-3.5" />}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
