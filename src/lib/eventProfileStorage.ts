/**
 * Per-event profile storage (displayName, avatarUrl) in localStorage.
 * Shared by EventLobby and GamePlay.
 */
export type ProfileSetupData = { displayName: string; avatarUrl: string };

const profileKey = (eventId: string) => `event_profile_${eventId}`;

export function getStoredEventProfile(eventId: string): ProfileSetupData | null {
  try {
    const raw = localStorage.getItem(profileKey(eventId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveEventProfile(eventId: string, data: ProfileSetupData): void {
  localStorage.setItem(profileKey(eventId), JSON.stringify(data));
}
