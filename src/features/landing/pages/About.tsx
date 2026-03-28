import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, Hexagon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

export default function About() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl flex items-center justify-between h-14 px-4 sm:px-6">
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

      <article className="mx-auto max-w-2xl px-4 sm:px-6 py-10 sm:py-16">
        <h1 className="text-[24px] sm:text-[32px] font-bold tracking-tight mb-4 sm:mb-6">{t('static.about.title')}</h1>

        <div className="space-y-4 sm:space-y-6 text-[13px] sm:text-[14px] text-muted-foreground leading-relaxed">
          <p>{t('static.about.intro')}</p>

          <h2 className="text-[16px] sm:text-[18px] font-semibold text-foreground pt-2">{t('static.about.missionTitle')}</h2>
          <p>{t('static.about.mission')}</p>

          <h2 className="text-[16px] sm:text-[18px] font-semibold text-foreground pt-2">{t('static.about.storyTitle')}</h2>
          <p>{t('static.about.story')}</p>

          <h2 className="text-[16px] sm:text-[18px] font-semibold text-foreground pt-2">{t('static.about.valuesTitle')}</h2>
          <ul className="space-y-2 list-disc pl-5">
            {(t('static.about.values', { returnObjects: true }) as string[]).map((v, i) => (
              <li key={i}>{v}</li>
            ))}
          </ul>
        </div>
      </article>
    </div>
  );
}
