import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

interface SupportFAQProps {
  faqs: FAQItem[];
}

export const SupportFAQ: React.FC<SupportFAQProps> = ({ faqs }) => {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = faqs.filter(item =>
    item.question.toLowerCase().includes(search.toLowerCase()) ||
    item.answer.toLowerCase().includes(search.toLowerCase())
  );

  const groupedByCategory = filtered.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, FAQItem[]>);

  const categories = Object.keys(groupedByCategory);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Search */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('support.searchFAQ')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {search && (
          <p className="text-sm text-muted-foreground mt-2">
            {t('support.foundResults', { count: filtered.length })}
          </p>
        )}
      </div>

      {/* FAQs by Category */}
      {categories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('support.noResultsFound')}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map(category => (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-4 text-foreground/90">
                {t(`support.category_${category.toLowerCase()}`, { defaultValue: category })}
              </h3>
              <div className="space-y-3">
                {groupedByCategory[category].map(item => (
                  <div
                    key={item.id}
                    className="border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors"
                  >
                    <button
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-accent/5 transition-colors text-left"
                    >
                      <span className="font-medium text-foreground/90">{item.question}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-muted-foreground transition-transform ${
                          expandedId === item.id ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {expandedId === item.id && (
                      <div className="px-4 py-3 border-t border-border bg-background/50">
                        <p className="text-sm text-foreground/70 leading-relaxed">{item.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
