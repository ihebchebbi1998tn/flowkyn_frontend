import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Hexagon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

export default function Privacy() {
  const { t } = useTranslation();
  const sections = t('static.privacy.sections', { returnObjects: true }) as { title: string; content: string }[];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border">
        <div className="mx-auto max-w-3xl flex items-center justify-between h-14 px-6">
          <Link to={ROUTES.HOME} className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Hexagon className="h-3.5 w-3.5" />
            </div>
            <span className="text-[15px] font-bold tracking-tight">Flowkyn</span>
          </Link>
          <Link to={ROUTES.HOME}>
            <Button variant="ghost" size="sm" className="text-[13px]">{t('common.back')}</Button>
          </Link>
        </div>
      </nav>

      <article className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-[32px] font-bold tracking-tight mb-2">{t('static.privacy.title')}</h1>
        <p className="text-[13px] text-muted-foreground mb-10">{t('static.privacy.lastUpdated')}</p>

        <div className="space-y-8">
          {sections.map((section, i) => (
            <div key={i}>
              <h2 className="text-[16px] font-semibold mb-2">{section.title}</h2>
              <p className="text-[13px] text-muted-foreground leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}
