export interface GameParticipant {
  id: string;
  name: string;
  email: string | null;
  avatar: string;
  avatarUrl: string | null;
  status: 'joined' | 'pending';
  joinedAt: string | null;
  score: number;
  isHost?: boolean;
}
