import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Hexagon, Shield, Lock, Server, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

export default function Security() {
  const { t } = useTranslation();

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

      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-[32px] font-bold tracking-tight mb-2">{t('static.security.title')}</h1>
        <p className="text-[15px] text-muted-foreground mb-12">{t('static.security.subtitle')}</p>

        <div className="grid gap-6 sm:grid-cols-2">
          {[
            { icon: Lock, key: 'encryption' },
            { icon: Server, key: 'infrastructure' },
            { icon: Shield, key: 'compliance' },
            { icon: Eye, key: 'privacy' },
          ].map(({ icon: Icon, key }) => (
            <div key={key} className="rounded-xl border border-border bg-card p-5">
              <Icon className="h-5 w-5 text-primary mb-3" />
              <h3 className="text-[14px] font-semibold mb-1.5">{t(`static.security.${key}.title`)}</h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">{t(`static.security.${key}.description`)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
