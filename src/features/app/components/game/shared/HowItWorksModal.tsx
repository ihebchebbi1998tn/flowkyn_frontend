import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type SectionList = {
  title?: string;
  items?: string[];
};

type HowItWorksContent = {
  title?: string;
  goal?: string;
  time?: { title?: string; body?: string };
  how?: { title?: string; steps?: string[] };
  rules?: SectionList;
  tips?: SectionList;
  host?: SectionList;
  privacy?: { title?: string; body?: string };
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

function getString(t: TFunction, key: string): string | undefined {
  const v = t(key, { defaultValue: '' }) as unknown;
  return typeof v === 'string' && v.trim() ? v : undefined;
}

function getStringArray(t: TFunction, key: string): string[] {
  const v = t(key, { returnObjects: true, defaultValue: [] }) as unknown;
  if (isStringArray(v)) return v.filter((s) => s.trim());
  return [];
}

export function HowItWorksModal(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Base i18n key, e.g. `gameHowItWorks.strategicEscape` */
  baseKey: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const { open, onOpenChange, baseKey, className } = props;

  const content: HowItWorksContent = useMemo(() => {
    const title = getString(t, `${baseKey}.title`);
    const goal = getString(t, `${baseKey}.goal`);

    const timeTitle = getString(t, `${baseKey}.time.title`);
    const timeBody = getString(t, `${baseKey}.time.body`);

    const howTitle = getString(t, `${baseKey}.how.title`);
    const howSteps = getStringArray(t, `${baseKey}.how.steps`);

    const rulesTitle = getString(t, `${baseKey}.rules.title`);
    const rulesItems = getStringArray(t, `${baseKey}.rules.items`);

    const tipsTitle = getString(t, `${baseKey}.tips.title`);
    const tipsItems = getStringArray(t, `${baseKey}.tips.items`);

    const hostTitle = getString(t, `${baseKey}.host.title`);
    const hostItems = getStringArray(t, `${baseKey}.host.items`);

    const privacyTitle = getString(t, `${baseKey}.privacy.title`);
    const privacyBody = getString(t, `${baseKey}.privacy.body`);

    return {
      title,
      goal,
      time: timeTitle || timeBody ? { title: timeTitle, body: timeBody } : undefined,
      how: howTitle || howSteps.length ? { title: howTitle, steps: howSteps } : undefined,
      rules: rulesTitle || rulesItems.length ? { title: rulesTitle, items: rulesItems } : undefined,
      tips: tipsTitle || tipsItems.length ? { title: tipsTitle, items: tipsItems } : undefined,
      host: hostTitle || hostItems.length ? { title: hostTitle, items: hostItems } : undefined,
      privacy: privacyTitle || privacyBody ? { title: privacyTitle, body: privacyBody } : undefined,
    };
  }, [t, baseKey]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('max-w-2xl', className)}>
        <DialogHeader>
          <DialogTitle>{content.title || t('gameHowItWorks.common.title', { defaultValue: 'How this works' })}</DialogTitle>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-auto pr-1 space-y-5">
          {content.goal && (
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t('gameHowItWorks.common.goalTitle', { defaultValue: 'Goal' })}
              </p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{content.goal}</p>
            </div>
          )}

          {content.time?.body && (
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {content.time.title || t('gameHowItWorks.common.timeTitle', { defaultValue: 'Timing' })}
              </p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{content.time.body}</p>
            </div>
          )}

          {content.how?.steps?.length ? (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {content.how.title || t('gameHowItWorks.common.howTitle', { defaultValue: 'How it works' })}
              </p>
              <ol className="space-y-1.5 list-decimal pl-5 text-sm text-foreground">
                {content.how.steps.map((s, i) => (
                  <li key={`${baseKey}-how-${i}`} className="whitespace-pre-wrap">
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {content.rules?.items?.length ? (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {content.rules.title || t('gameHowItWorks.common.rulesTitle', { defaultValue: 'Rules' })}
              </p>
              <ul className="space-y-1.5 list-disc pl-5 text-sm text-foreground">
                {content.rules.items.map((s, i) => (
                  <li key={`${baseKey}-rules-${i}`} className="whitespace-pre-wrap">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {content.tips?.items?.length ? (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {content.tips.title || t('gameHowItWorks.common.tipsTitle', { defaultValue: 'Tips' })}
              </p>
              <ul className="space-y-1.5 list-disc pl-5 text-sm text-foreground">
                {content.tips.items.map((s, i) => (
                  <li key={`${baseKey}-tips-${i}`} className="whitespace-pre-wrap">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {content.host?.items?.length ? (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {content.host.title || t('gameHowItWorks.common.hostTitle', { defaultValue: 'Host controls' })}
              </p>
              <ul className="space-y-1.5 list-disc pl-5 text-sm text-foreground">
                {content.host.items.map((s, i) => (
                  <li key={`${baseKey}-host-${i}`} className="whitespace-pre-wrap">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {content.privacy?.body ? (
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {content.privacy.title || t('gameHowItWorks.common.privacyTitle', { defaultValue: 'Privacy' })}
              </p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{content.privacy.body}</p>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

