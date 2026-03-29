/**
 * Meeting Room - Shared types used by sub-components
 */
export interface MeetingPerson {
  participantId: string;
  name: string;
  avatar: string;
  avatarUrl?: string | null;
}

export type VoiceStatus = 'idle' | 'requesting_microphone' | 'connecting' | 'connected' | 'error';

/** Format seconds to MM:SS */
export function formatMeetingTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
