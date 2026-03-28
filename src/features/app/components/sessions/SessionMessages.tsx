/**
 * @fileoverview Session Messages Component
 *
 * Displays messages exchanged during a game session.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SessionMessage } from '@/features/app/api/gameSessions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useSessionMessages } from '@/hooks/queries/useSessionsQueries';

interface SessionMessagesProps {
  messages: SessionMessage[];
  sessionId: string;
}

export function SessionMessages({ messages, sessionId }: SessionMessagesProps) {
  const { t } = useTranslation();
  const [limit, setLimit] = useState(50);

  const { data: paginatedMessages } = useSessionMessages(
    sessionId,
    limit,
    0,
    messages.length > 0
  );

  const displayMessages = paginatedMessages?.messages || messages;
  const totalCount = paginatedMessages?.total || messages.length;

  return (
    <div className="space-y-4">
      {displayMessages.length === 0 ? (
        <Card className="p-6 text-center text-gray-500">
          {t('session.noMessages', 'No messages yet')}
        </Card>
      ) : (
        <>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {displayMessages.map((message) => (
              <Card key={message.id} className="p-4">
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={message.avatar_url || undefined} />
                    <AvatarFallback>{message.participant_name.charAt(0)}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{message.participant_name}</p>
                      <span className="text-xs text-gray-500">
                        {Math.round(message.timestamp_minutes)}m
                      </span>
                      {message.message_type !== 'text' && (
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                          {message.message_type}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 break-words">{message.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(message.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {displayMessages.length < totalCount && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setLimit(limit + 50)}
            >
              <ChevronDown className="w-4 h-4 mr-2" />
              {t('session.loadMore', 'Load more')} ({displayMessages.length} /{' '}
              {totalCount})
            </Button>
          )}
        </>
      )}
    </div>
  );
}
