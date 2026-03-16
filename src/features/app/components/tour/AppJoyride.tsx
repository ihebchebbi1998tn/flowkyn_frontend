import { useEffect, useState } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useTranslation } from 'react-i18next';

export function AppJoyride() {
  const { t } = useTranslation();
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Adding a short timeout ensures elements have properly mounted
    const timer = setTimeout(() => {
      const hasSeenTour = localStorage.getItem('flowkyn_tour_completed');
      if (!hasSeenTour) {
        setRun(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('flowkyn_tour_completed', 'true');
    }
  };

  const steps: Step[] = [
    {
      target: 'body',
      placement: 'center',
      content: (
        <div className="text-center space-y-2">
          <h3 className="text-lg font-bold text-foreground">{t('tour.welcome.title')}</h3>
          <p className="text-muted-foreground text-sm">{t('tour.welcome.content')}</p>
        </div>
      ),
      disableBeacon: true,
    },
    {
      target: '#tour-dashboard',
      content: (
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">{t('tour.dashboard.title')}</h3>
          <p className="text-muted-foreground text-sm">{t('tour.dashboard.content')}</p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '#tour-games',
      content: (
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">{t('tour.activities.title')}</h3>
          <p className="text-muted-foreground text-sm">{t('tour.activities.content')}</p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '#tour-organizations',
      content: (
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">{t('tour.organizations.title')}</h3>
          <p className="text-muted-foreground text-sm">{t('tour.organizations.content')}</p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '#tour-analytics',
      content: (
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">{t('tour.analytics.title')}</h3>
          <p className="text-muted-foreground text-sm">{t('tour.analytics.content')}</p>
        </div>
      ),
      placement: 'right',
    },
  ];

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      scrollToFirstStep
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#10b981', // Tailwind Emerald-500 matching the flowkyn green
          zIndex: 10000,
          backgroundColor: 'hsl(var(--background))',
          textColor: 'hsl(var(--foreground))',
          arrowColor: 'hsl(var(--background))',
          overlayColor: 'hsl(var(--background)/0.8)',
        },
        tooltipContainer: {
          textAlign: 'left'
        },
        buttonNext: {
          backgroundColor: '#10b981',
          borderRadius: '8px',
          padding: '8px 16px',
          fontWeight: 600,
          color: '#ffffff'
        },
        buttonBack: {
          marginRight: '8px',
          color: 'hsl(var(--muted-foreground))',
        },
        buttonSkip: {
          color: 'hsl(var(--muted-foreground))',
        }
      }}
      locale={{
        last: t('tour.last'),
        skip: t('tour.skip'),
        next: t('tour.next'),
        back: t('tour.back'),
        close: t('tour.close'),
      }}
    />
  );
}
