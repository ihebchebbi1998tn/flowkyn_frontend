export interface GameParticipant {
  id: string;
  name: string;
  email: string | null;
  avatar: string;
  status: 'joined' | 'pending';
  joinedAt: string | null;
  score: number;
  isHost?: boolean;
}
