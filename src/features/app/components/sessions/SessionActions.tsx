/**
 * @fileoverview Session Actions Component
 *
 * Displays all actions performed during a game session.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SessionAction } from '@/features/app/api/gameSessions';

interface SessionActionsProps {
  actions: SessionAction[];
}

export function SessionActions({ actions }: SessionActionsProps) {
  const { t } = useTranslation();

  const groupedByRound = actions.reduce(
    (acc, action) => {
      const round = action.round_number;
      if (!acc[round]) {
        acc[round] = [];
      }
      acc[round].push(action);
      return acc;
    },
    {} as Record<number, SessionAction[]>
  );

  const sortedRounds = Object.keys(groupedByRound)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {sortedRounds.length === 0 ? (
        <Card className="p-6 text-center text-gray-500">
          {t('session.noActions', 'No actions yet')}
        </Card>
      ) : (
        sortedRounds.map((round) => (
          <div key={round}>
            <h3 className="font-semibold text-lg mb-3">
              {t('session.round', 'Round')} {round}
            </h3>
            <div className="space-y-2">
              {groupedByRound[round]!.map((action) => (
                <Card key={action.id} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        {t('session.participant', 'Participant')}
                      </p>
                      <p className="font-semibold">{action.participant_name}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">{t('session.action', 'Action')}</p>
                      <Badge variant="outline">{action.action_type}</Badge>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">
                        {t('session.timestamp', 'Timestamp')}
                      </p>
                      <p className="text-sm">
                        {Math.round(action.timestamp_minutes)}m •{' '}
                        {new Date(action.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {Object.keys(action.payload).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-2">
                        {t('session.payload', 'Details')}
                      </p>
                      <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(action.payload, null, 2)}
                      </pre>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
