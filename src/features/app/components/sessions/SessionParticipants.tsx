/**
 * @fileoverview Session Participants Component
 *
 * Displays all participants in a game session with their interactions.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SessionParticipant } from '@/features/app/api/gameSessions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, MessageSquare, Zap } from 'lucide-react';

interface SessionParticipantsProps {
  participants: SessionParticipant[];
}

export function SessionParticipants({ participants }: SessionParticipantsProps) {
  const { t } = useTranslation();

  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.is_active !== b.is_active) {
      return a.is_active ? -1 : 1;
    }
    return (b.interaction_count || 0) - (a.interaction_count || 0);
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        {sortedParticipants.length === 0 ? (
          <Card className="p-6 text-center text-gray-500">
            {t('session.noParticipants', 'No participants yet')}
          </Card>
        ) : (
          sortedParticipants.map((participant) => (
            <Card key={participant.participant_id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={participant.avatar_url || undefined} />
                    <AvatarFallback>{participant.display_name.charAt(0)}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{participant.display_name}</p>
                      {participant.is_active && (
                        <Badge className="bg-green-100 text-green-800">
                          {t('session.active', 'Active')}
                        </Badge>
                      )}
                      {participant.participant_type === 'guest' && (
                        <Badge variant="outline">{t('session.guest', 'Guest')}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {t('session.joined', 'Joined')}{' '}
                      {new Date(participant.joined_at || '').toLocaleString()}
                      {participant.left_at && (
                        <>
                          {' '}
                          • {t('session.left', 'Left')}{' '}
                          {new Date(participant.left_at).toLocaleString()}
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 ml-4">
                  <div className="text-center">
                    <div className="flex items-center gap-1 justify-center">
                      <MessageSquare className="w-4 h-4 text-blue-500" />
                      <span className="font-semibold">{participant.message_count}</span>
                    </div>
                    <p className="text-xs text-gray-600">{t('session.messages', 'Messages')}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 justify-center">
                      <Zap className="w-4 h-4 text-orange-500" />
                      <span className="font-semibold">{participant.action_count}</span>
                    </div>
                    <p className="text-xs text-gray-600">{t('session.actions', 'Actions')}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 justify-center">
                      <Users className="w-4 h-4 text-purple-500" />
                      <span className="font-semibold">{participant.interaction_count}</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {t('session.interactions', 'Interactions')}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
