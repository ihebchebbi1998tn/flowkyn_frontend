import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface RoleBasedPromptsData {
  role: string;
  prompts: string[];
}

export interface RoleBasedPromptsDisplayProps {
  participantId: string;
  sessionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoleBasedPromptsDisplay({
  participantId,
  sessionId,
  open,
  onOpenChange,
}: RoleBasedPromptsDisplayProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<RoleBasedPromptsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !participantId || !sessionId) {
      setLoading(true);
      return;
    }

    const loadPrompts = async () => {
      try {
        setLoading(true);
        // Call backend API to get role-based prompts
        const response = await fetch(
          `/api/games/coffee-roulette/prompts/${participantId}?sessionId=${sessionId}`,
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch prompts: ${response.statusText}`);
        }

        const prompts = await response.json();
        setData(prompts);

        // Auto-select first prompt if available
        if (prompts.prompts && prompts.prompts.length > 0) {
          setSelectedPrompt(prompts.prompts[0]);
        }
      } catch (error) {
        console.warn('Failed to load role-based prompts:', error);
        // Fallback: use generic prompts or show empty state
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    loadPrompts();
  }, [open, participantId, sessionId]);

  const getRoleLabel = (role: string): string => {
    const roleKey = `gamePlay.coffeeRoulette.roles.${role}`;
    return t(roleKey, { defaultValue: role });
  };

  const translatePrompt = (prompt: string): string => {
    // If it's already a full prompt text, return it
    if (!prompt.includes('gamePlay.')) {
      return prompt;
    }
    // Otherwise, use i18n to translate it
    return t(prompt, { defaultValue: prompt });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            {t('gamePlay.coffeeRoulette.rolePrompts.title', {
              defaultValue: 'Suggested Conversation Starters',
            })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                {t('gamePlay.coffeeRoulette.rolePrompts.loading', {
                  defaultValue: 'Loading suggestions...',
                })}
              </span>
            </div>
          ) : data && data.prompts.length > 0 ? (
            <>
              <div className="text-sm text-muted-foreground">
                {t('gamePlay.coffeeRoulette.rolePrompts.description', {
                  defaultValue: 'Based on your role as a {{role}}, here are some great conversation starters:',
                  role: getRoleLabel(data.role),
                })}
              </div>

              <div className="space-y-2">
                {data.prompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedPrompt(prompt)}
                    className={cn(
                      'w-full p-3 text-left rounded-lg border-2 transition-all',
                      'hover:border-primary hover:bg-primary/5',
                      selectedPrompt === prompt
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-background'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {translatePrompt(prompt)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-2 flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="h-10"
                >
                  {t('gamePlay.coffeeRoulette.rolePrompts.dismiss', {
                    defaultValue: 'Close',
                  })}
                </Button>
                <Button
                  onClick={() => {
                    // The selected prompt is just for UI reference
                    // The actual prompt selection happens during the chat
                    onOpenChange(false);
                  }}
                  className="h-10"
                >
                  {t('gamePlay.coffeeRoulette.rolePrompts.ready', {
                    defaultValue: 'Ready to chat!',
                  })}
                </Button>
              </div>
            </>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {t('gamePlay.coffeeRoulette.rolePrompts.empty', {
                  defaultValue: 'No suggestions available at this time.',
                })}
              </p>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="mt-4 h-10"
              >
                {t('common.close', { defaultValue: 'Close' })}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
