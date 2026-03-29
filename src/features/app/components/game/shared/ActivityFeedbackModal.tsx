import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Loader2, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { getGuestToken } from '@/lib/guestTokenPersistence';
import { activityFeedbacksApi, type ActivityFeedbackCategory, type ActivityFeedbackSource } from '@/features/app/api/activityFeedbacks';

export interface ActivityFeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabledReason?: string;

  eventId: string;
  participantId: string | null;
  gameSessionId: string | null;
  gameTypeKey: string;
  source: ActivityFeedbackSource;

  onSubmitted: () => void;
}

export function ActivityFeedbackModal({
  open,
  onOpenChange,
  disabledReason,
  eventId,
  participantId,
  gameSessionId,
  gameTypeKey,
  source,
  onSubmitted,
}: ActivityFeedbackModalProps) {
  const { t } = useTranslation();
  const [rating, setRating] = useState<number>(5);
  const [category, setCategory] = useState<ActivityFeedbackCategory>('experience');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRating(5);
    setCategory('experience');
    setComment('');
    setError(null);
    setSubmitting(false);
    setSuccess(false);
  }, [open]);

  const categories = useMemo(
    () =>
      [
        { key: 'experience' as const, label: t('activityFeedback.categories.experience', { defaultValue: 'Overall experience' }) },
        { key: 'ui' as const, label: t('activityFeedback.categories.ui', { defaultValue: 'UI / design' }) },
        { key: 'gameplay' as const, label: t('activityFeedback.categories.gameplay', { defaultValue: 'Experience' }) },
        { key: 'voice_audio' as const, label: t('activityFeedback.categories.voice_audio', { defaultValue: 'Voice / audio' }) },
        { key: 'other' as const, label: t('activityFeedback.categories.other', { defaultValue: 'Other' }) },
      ] as const,
    [t],
  );

  const canSubmit = !!participantId && eventId.trim().length > 0 && gameTypeKey.trim().length > 0 && comment.trim().length > 0 && !submitting;

  const submit = async () => {
    if (!participantId) return;
    setError(null);
    setSubmitting(true);
    try {
      // If the user is a guest, we must force the guest token even if an
      // access_token exists in localStorage; otherwise the backend will
      // validate ownership against the wrong participant type.
      const guestParticipantId = localStorage.getItem(`guest_participant_id_${eventId}`);
      const forceGuestToken =
        guestParticipantId && guestParticipantId === participantId
          ? (eventId ? getGuestToken(eventId) : localStorage.getItem('guest_token')) || undefined
          : undefined;

      await activityFeedbacksApi.create({
        eventId,
        gameSessionId,
        gameTypeKey,
        participantId,
        rating,
        category,
        comment,
        source,
      }, { authToken: forceGuestToken });
      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        onSubmitted();
      }, 500);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || t('activityFeedback.modal.submitFailed', { defaultValue: 'Failed to submit feedback' }));
    } finally {
      setSubmitting(false);
    }
  };

  const title = t('activityFeedback.modal.title', { defaultValue: 'Help us improve' });
  const subtitle = t('activityFeedback.modal.subtitle', { defaultValue: 'Before you leave, rate your experience and leave a quick comment.' });

  const handleDialogOpenChange = (nextOpen: boolean) => {
    // If the user dismisses the modal without submitting (skip / close / backdrop),
    // still send them back to the lobby.
    if (!nextOpen && !success) {
      onSubmitted();
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {!success ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{subtitle}</p>

            {disabledReason && (
              <div className="p-3 bg-muted/30 border border-border rounded-lg text-sm text-muted-foreground">
                {disabledReason}
              </div>
            )}

            <div className="space-y-2">
              <Label>{t('activityFeedback.modal.ratingLabel', { defaultValue: 'Rating' })}</Label>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, idx) => {
                  const v = idx + 1;
                  const active = v <= rating;
                  return (
                    <button
                      key={v}
                      type="button"
                      className="p-1 rounded-lg hover:bg-muted/30 transition-colors"
                      onClick={() => setRating(v)}
                      aria-label={t('activityFeedback.modal.ratingAria', { defaultValue: '{{n}} stars', n: v })}
                    >
                      <Star
                        className={cn(
                          'h-7 w-7',
                          active ? 'text-warning' : 'text-muted-foreground',
                        )}
                        style={{
                          fill: active ? 'currentColor' : 'none',
                          strokeWidth: 1.5,
                        }}
                      />
                    </button>
                  );
                })}
                <span className="ml-2 text-sm font-medium text-foreground tabular-nums">
                  {rating}/5
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('activityFeedback.modal.categoryLabel', { defaultValue: 'Category' })}</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ActivityFeedbackCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.key} value={c.key}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activityFeedbackComment">
                {t('activityFeedback.modal.commentLabel', { defaultValue: 'Comment' })}
              </Label>
              <Textarea
                id="activityFeedbackComment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder={t('activityFeedback.modal.commentPlaceholder', { defaultValue: 'What went well? What can we improve?' })}
                maxLength={5000}
              />
              <p className="text-xs text-muted-foreground">{comment.trim().length}/5000</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-900">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { onOpenChange(false); onSubmitted(); }}
                disabled={submitting}
              >
                {t('activityFeedback.modal.skip', { defaultValue: 'Skip' })}
              </Button>
              <Button
                type="button"
                onClick={() => void submit()}
                disabled={!canSubmit}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('activityFeedback.modal.submitting', { defaultValue: 'Submitting…' })}
                  </>
                ) : (
                  t('activityFeedback.modal.submit', { defaultValue: 'Submit feedback' })
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 p-2">
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-900">{t('activityFeedback.modal.successTitle', { defaultValue: 'Thanks for your feedback!' })}</p>
                <p className="text-sm text-green-800 mt-1">{t('activityFeedback.modal.successDescription', { defaultValue: 'Redirecting you back to the event.' })}</p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

