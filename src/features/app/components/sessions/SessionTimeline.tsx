/**
 * @fileoverview Session Timeline Component
 *
 * Displays a chronological timeline of events in a game session.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SessionTimeline as TimelineData } from '@/features/app/api/gameSessions';
import { LogIn, LogOut, Play, Square, Zap } from 'lucide-react';

interface SessionTimelineProps {
  timeline: TimelineData[];
}

export function SessionTimeline({ timeline }: SessionTimelineProps) {
  const { t } = useTranslation();

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'participant_joined':
        return <LogIn className="w-4 h-4 text-green-500" />;
      case 'participant_left':
        return <LogOut className="w-4 h-4 text-red-500" />;
      case 'round_started':
        return <Play className="w-4 h-4 text-blue-500" />;
      case 'round_ended':
        return <Square className="w-4 h-4 text-gray-500" />;
      case 'action':
        return <Zap className="w-4 h-4 text-orange-500" />;
      default:
        return null;
    }
  };

  const getEventLabel = (eventType: string, data: TimelineData) => {
    switch (eventType) {
      case 'participant_joined':
        return t('session.timeline.joined', `{{name}} joined`, {
          name: data.participant_name,
        });
      case 'participant_left':
        return t('session.timeline.left', `{{name}} left`, {
          name: data.participant_name,
        });
      case 'round_started':
        return t('session.timeline.roundStarted', `Round {{number}} started`, {
          number: data.round_number,
        });
      case 'round_ended':
        return t('session.timeline.roundEnded', `Round {{number}} ended`, {
          number: data.round_number,
        });
      case 'action':
        return t('session.timeline.action', `{{name}} performed {{action}}`, {
          name: data.participant_name,
          action: data.action_type,
        });
      default:
        return 'Unknown event';
    }
  };

  const getEventBadgeColor = (eventType: string) => {
    switch (eventType) {
      case 'participant_joined':
        return 'bg-green-100 text-green-800';
      case 'participant_left':
        return 'bg-red-100 text-red-800';
      case 'round_started':
        return 'bg-blue-100 text-blue-800';
      case 'round_ended':
        return 'bg-gray-100 text-gray-800';
      case 'action':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {timeline.length === 0 ? (
        <Card className="p-6 text-center text-gray-500">
          {t('session.noTimeline', 'No events yet')}
        </Card>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-gray-200" />

          {/* Events */}
          <div className="space-y-4">
            {timeline.map((event, index) => (
              <div key={index} className="relative pl-20">
                {/* Timeline dot */}
                <div className="absolute left-0 top-1 p-1.5 bg-white border-2 border-gray-200 rounded-full">
                  {getEventIcon(event.event_type)}
                </div>

                {/* Event card */}
                <Card className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">
                        {getEventLabel(event.event_type, event)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Badge className={getEventBadgeColor(event.event_type)}>
                      {event.event_type.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
