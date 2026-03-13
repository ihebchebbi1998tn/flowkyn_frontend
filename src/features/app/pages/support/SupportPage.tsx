import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, HelpCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { SupportFAQ } from './SupportFAQ';
import { ReportIssueModal } from './ReportIssueModal';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const SupportPage: React.FC = () => {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);

  // FAQ items - translated keys
  const faqs: FAQItem[] = useMemo(() => [
    {
      id: 'faq-1',
      category: 'getting_started',
      question: t('support.faq.getting_started.q1'),
      answer: t('support.faq.getting_started.a1'),
    },
    {
      id: 'faq-2',
      category: 'getting_started',
      question: t('support.faq.getting_started.q2'),
      answer: t('support.faq.getting_started.a2'),
    },
    {
      id: 'faq-3',
      category: 'getting_started',
      question: t('support.faq.getting_started.q3'),
      answer: t('support.faq.getting_started.a3'),
    },
    {
      id: 'faq-4',
      category: 'events',
      question: t('support.faq.events.q1'),
      answer: t('support.faq.events.a1'),
    },
    {
      id: 'faq-5',
      category: 'events',
      question: t('support.faq.events.q2'),
      answer: t('support.faq.events.a2'),
    },
    {
      id: 'faq-6',
      category: 'events',
      question: t('support.faq.events.q3'),
      answer: t('support.faq.events.a3'),
    },
    {
      id: 'faq-7',
      category: 'activities',
      question: t('support.faq.activities.q1'),
      answer: t('support.faq.activities.a1'),
    },
    {
      id: 'faq-8',
      category: 'activities',
      question: t('support.faq.activities.q2'),
      answer: t('support.faq.activities.a2'),
    },
    {
      id: 'faq-9',
      category: 'activities',
      question: t('support.faq.activities.q3'),
      answer: t('support.faq.activities.a3'),
    },
    {
      id: 'faq-10',
      category: 'teams',
      question: t('support.faq.teams.q1'),
      answer: t('support.faq.teams.a1'),
    },
    {
      id: 'faq-11',
      category: 'teams',
      question: t('support.faq.teams.q2'),
      answer: t('support.faq.teams.a2'),
    },
    {
      id: 'faq-12',
      category: 'teams',
      question: t('support.faq.teams.q3'),
      answer: t('support.faq.teams.a3'),
    },
    {
      id: 'faq-13',
      category: 'technical',
      question: t('support.faq.technical.q1'),
      answer: t('support.faq.technical.a1'),
    },
    {
      id: 'faq-14',
      category: 'technical',
      question: t('support.faq.technical.q2'),
      answer: t('support.faq.technical.a2'),
    },
    {
      id: 'faq-15',
      category: 'technical',
      question: t('support.faq.technical.q3'),
      answer: t('support.faq.technical.a3'),
    },
  ], [t]);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={t('support.title')}
        subtitle={t('support.description')}
      />

      <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="p-6 rounded-lg border border-border bg-card/50 hover:bg-card/80 transition-colors">
            <div className="flex items-start gap-4">
              <HelpCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  {t('support.card_faq_title')}
                </h3>
                <p className="text-sm text-foreground/70">
                  {t('support.card_faq_desc')}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-lg border border-border bg-card/50 hover:bg-card/80 transition-colors">
            <div className="flex items-start gap-4">
              <MessageSquare className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  {t('support.card_report_title')}
                </h3>
                <p className="text-sm text-foreground/70">
                  {t('support.card_report_desc')}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-lg border border-border bg-card/50 hover:bg-card/80 transition-colors">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  {t('support.card_contact_title')}
                </h3>
                <p className="text-sm text-foreground/70">
                  {t('support.card_contact_desc')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Report Issue Button */}
        <div className="mb-12 flex justify-center">
          <Button
            onClick={() => setModalOpen(true)}
            size="lg"
            className="gap-2"
          >
            <MessageSquare className="w-5 h-5" />
            {t('support.reportIssueButton')}
          </Button>
        </div>

        {/* FAQ Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-8 text-foreground">
            {t('support.faqTitle')}
          </h2>
          <SupportFAQ faqs={faqs} />
        </div>

        {/* Still Need Help */}
        <div className="p-8 rounded-lg border border-border bg-gradient-to-br from-primary/5 to-primary/10 text-center">
          <h3 className="text-xl font-semibold text-foreground mb-3">
            {t('support.stillNeedHelp')}
          </h3>
          <p className="text-foreground/70 mb-6 max-w-2xl mx-auto">
            {t('support.stillNeedHelpDesc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => setModalOpen(true)}
            >
              {t('support.reportIssueButton')}
            </Button>
            <a href="mailto:support@flowkyn.com">
              <Button variant="default">
                {t('support.contactSupport')}
              </Button>
            </a>
          </div>
        </div>
      </div>

      <ReportIssueModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
};

export default SupportPage;
