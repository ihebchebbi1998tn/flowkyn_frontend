import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { PageHeader, PageShell } from '@/features/app/components/dashboard';
import { api } from '@/features/app/api/client';
import { ApiError } from '@/lib/apiError';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoadingButton } from '@/components/ui/loading-button';
import { cn } from '@/lib/utils';

type ChatRole = 'system' | 'user' | 'assistant';

type ChatMessage = {
  role: ChatRole;
  content: string;
  reasoning_details?: unknown;
};

type AiChatResponse = {
  content: string;
  model: string;
  reasoningDetails?: unknown;
  reasoning_details?: unknown;
};

export default function IdeaChatPage() {
  const { t } = useTranslation();

  const [model, setModel] = useState<string>('');
  const [reasoningEnabled, setReasoningEnabled] = useState(true);
  const [idea, setIdea] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'system',
      content:
        'You are a creative game designer. Turn the user idea into a structured AI-powered interactive event plan. Be specific and practical.',
    },
  ]);

  const chatPayloadMessages = useMemo(
    () =>
      messages.map((m) => {
        // OpenRouterProvider forwards the full message objects; we only attach reasoning_details when we have it.
        const base = { role: m.role, content: m.content };
        if (m.role === 'assistant' && m.reasoning_details !== undefined) {
          return { ...base, reasoning_details: m.reasoning_details };
        }
        return base;
      }),
    [messages]
  );

  const sendIdea = async () => {
    const trimmed = idea.trim();
    if (!trimmed) return;
    if (isLoading) return;

    setIsLoading(true);
    const nextUser: ChatMessage = { role: 'user', content: trimmed };

    // Optimistically append the user message so the UI feels responsive.
    setMessages((prev) => [...prev, nextUser]);
    setIdea('');

    try {
      const response = await api.post<AiChatResponse>('/ai-events/chat/completions', {
        model: model || undefined,
        reasoningEnabled,
        messages: [...chatPayloadMessages, nextUser],
        jsonMode: false,
      });

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: response.content,
        reasoning_details: response.reasoning_details ?? response.reasoningDetails,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      if (ApiError.is(err)) {
        toast.error(err.message);
      } else {
        toast.error('AI chat failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title={t('aiIdeaChat.title', { defaultValue: 'AI Idea Chat' })}
        subtitle={t('aiIdeaChat.subtitle', {
          defaultValue: 'Write a game idea; backend will call OpenRouter and return a reasoning-enabled response.',
        })}
        actions={
          <Button
            variant="outline"
            onClick={() =>
              setMessages([
                {
                  role: 'system',
                  content:
                    'You are a creative game designer. Turn the user idea into a structured AI-powered interactive event plan. Be specific and practical.',
                },
              ])
            }
          >
            Clear
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-label-sm font-semibold">{t('aiIdeaChat.chat', { defaultValue: 'Chat' })}</p>
            </div>
            <p className="text-label-xs text-muted-foreground">
              {messages.length - 1} turns
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[55vh] overflow-auto rounded-lg border border-border/60 bg-muted/20 p-3 space-y-3">
              {messages.map((m, idx) => {
                const isSystem = m.role === 'system';
                const isAssistant = m.role === 'assistant';
                return (
                  <div
                    key={`${m.role}-${idx}`}
                    className={cn(
                      'whitespace-pre-wrap rounded-xl border px-3 py-2',
                      isSystem && 'bg-background text-muted-foreground border-border/40',
                      isAssistant && 'bg-card/90 border-primary/20',
                      m.role === 'user' && 'bg-primary/5 border-primary/20'
                    )}
                  >
                    <div className="text-label-xs font-semibold mb-1">
                      {m.role === 'system' ? 'System' : m.role === 'user' ? 'You' : 'Assistant'}
                    </div>
                    <div className="text-body-sm">{m.content}</div>

                    {isAssistant && m.reasoning_details !== undefined && (
                      <details className="mt-2">
                        <summary className="text-label-xs text-muted-foreground cursor-pointer select-none">
                          Show reasoning_details
                        </summary>
                        <pre className="mt-2 overflow-auto rounded-lg bg-black/10 p-2 text-[11px] leading-snug text-muted-foreground">
                          {JSON.stringify(m.reasoning_details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <p className="text-label-sm font-semibold">{t('aiIdeaChat.composer', { defaultValue: 'Idea' })}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-label-xs text-muted-foreground font-semibold">
                {t('aiIdeaChat.modelLabel', { defaultValue: 'Model (optional)' })}
              </label>
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={t('aiIdeaChat.modelPlaceholder', { defaultValue: 'Leave empty for default model' })}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="reasoningEnabled"
                type="checkbox"
                checked={reasoningEnabled}
                onChange={(e) => setReasoningEnabled(e.target.checked)}
              />
              <label htmlFor="reasoningEnabled" className="text-label-xs font-semibold text-muted-foreground">
                Include reasoning_details
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-label-xs text-muted-foreground font-semibold">
                {t('aiIdeaChat.ideaLabel', { defaultValue: 'Write a game idea' })}
              </label>
              <Textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder={t('aiIdeaChat.ideaPlaceholder', {
                  defaultValue: 'Example: A 30-minute “Truth & Lie Remix” where players vote with secret emotions and the host reveals the twist.',
                })}
                rows={7}
              />
            </div>

            <LoadingButton
              className="w-full h-10"
              loading={isLoading}
              loadingText={t('aiIdeaChat.loading', { defaultValue: 'Sending...' })}
              onClick={sendIdea}
              disabled={!idea.trim()}
            >
              {t('aiIdeaChat.send', { defaultValue: 'Send to OpenRouter' })}
            </LoadingButton>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              This is a minimal dev UI. It calls <code className="font-mono">/ai-events/chat/completions</code>.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

