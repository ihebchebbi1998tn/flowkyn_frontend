import type { Notification } from '@/types';
import type { TFunction } from 'i18next';

interface FormattedNotification {
  title: string;
  message: string;
}

export function formatNotificationCopy(notification: Notification, t: TFunction): FormattedNotification {
  const data = (notification.data || {}) as any;

  switch (notification.type) {
    case 'event_created':
      return {
        title: t('notifications.eventCreated.title', {
          eventTitle: data.title,
        }),
        message: t('notifications.eventCreated.message', {
          eventTitle: data.title,
        }),
      };

    case 'event_joined':
      return {
        title: t('notifications.eventJoined.title', {
          eventTitle: data.title,
        }),
        message: t('notifications.eventJoined.message', {
          eventTitle: data.title,
        }),
      };

    case 'event_participant_joined':
      return {
        title: t('notifications.eventParticipantJoined.title', {
          eventTitle: data.title,
        }),
        message: t('notifications.eventParticipantJoined.message', {
          eventTitle: data.title,
          guestName: data.guest_name,
        }),
      };

    default:
      return {
        title: data.title || notification.type,
        message: data.message || '',
      };
  }
}

