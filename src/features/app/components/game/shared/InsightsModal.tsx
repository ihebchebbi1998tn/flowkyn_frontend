import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface InsightsData {
  accuracy: number;
  previousAccuracy: number | null;
  bestGuess: string;
  trickiestStatement: string;
  trickiestFoolPercentage: number;
  percentile: number;
}

interface InsightsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insights: InsightsData;
}

export function InsightsModal({ open, onOpenChange, insights }: InsightsModalProps) {
  const { t } = useTranslation();

  const improvement = insights.previousAccuracy 
    ? insights.accuracy - insights.previousAccuracy 
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {t('gamePlay.insights.title', { defaultValue: 'Your Performance' })}
          </DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Accuracy */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {t('gamePlay.insights.accuracy', { defaultValue: 'Accuracy' })}
              </span>
              <span className="text-2xl font-bold text-primary">
                {Math.round(insights.accuracy)}%
              </span>
            </div>
            {improvement !== null && (
              <div className="text-xs text-muted-foreground">
                {improvement >= 0 ? (
                  <span className="text-green-600">
                    {t('gamePlay.insights.improvement', {
                      defaultValue: '↑ from {{previousPercentage}}% last time',
                      previousPercentage: Math.round(insights.previousAccuracy!),
                    })}
                  </span>
                ) : (
                  <span className="text-amber-600">
                    {t('gamePlay.insights.improvement', {
                      defaultValue: '↑ from {{previousPercentage}}% last time',
                      previousPercentage: Math.round(insights.previousAccuracy!),
                    })}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Best Guess */}
          <div className="space-y-2 rounded-lg bg-muted p-3">
            <div className="text-sm font-medium">
              {t('gamePlay.insights.bestGuess', { defaultValue: '🎯 Best Guess' })}
            </div>
            <p className="text-sm text-muted-foreground italic">"{insights.bestGuess}"</p>
          </div>

          {/* Trickiest Statement */}
          <div className="space-y-2 rounded-lg bg-muted p-3">
            <div className="text-sm font-medium">
              {t('gamePlay.insights.trickiestStatement', { defaultValue: '😈 Trickiest Statement' })}
            </div>
            <p className="text-sm text-muted-foreground italic">"{insights.trickiestStatement}"</p>
            <div className="text-xs text-muted-foreground">
              {t('gamePlay.insights.fooled', {
                defaultValue: '{{percentage}}% of players fooled',
                percentage: Math.round(insights.trickiestFoolPercentage),
              })}
            </div>
          </div>

          {/* Ranking */}
          <div className="space-y-2 rounded-lg bg-primary/5 p-3 border border-primary/20">
            <div className="text-sm font-medium">
              {t('gamePlay.insights.yourRanking', { defaultValue: '📊 How You Compare' })}
            </div>
            <div className="text-lg font-semibold text-primary">
              {t('gamePlay.insights.topPercentile', {
                defaultValue: 'Top {{percentile}}% of all players',
                percentile: Math.max(1, Math.round(insights.percentile)),
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            {t('gamePlay.insights.close', { defaultValue: 'Close' })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
