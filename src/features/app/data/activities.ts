import { Coffee, Trophy, Target } from 'lucide-react';
import coffeeRouletteImg from '@/assets/games/coffee-roulette.jpg';
import winsOfTheWeekImg from '@/assets/games/wins-of-the-week.jpg';
import strategicEscapeImg from '@/assets/games/strategic-escape.jpg';

export type ActivityCategory = 'icebreaker' | 'connection' | 'wellness' | 'competition';
export type ActivityType = 'sync' | 'async';
export type ActivityDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type ActivityDuration = 'quick' | 'medium' | 'long' | 'ongoing';
export type ActivityTeamSize = 'pairs' | 'small' | 'medium' | 'large' | 'any';

export interface Activity {
  id: string;
  name: string;
  description: string;
  i18nKey?: string;
  category: ActivityCategory;
  type: ActivityType;
  duration: string;
  durationTag: ActivityDuration;
  teamSize: string;
  teamSizeTag: ActivityTeamSize;
  minPlayers: number;
  maxPlayers: number;
  difficulty: ActivityDifficulty;
  icon: typeof Coffee;
  color: string;
  bgColor: string;
  popular?: boolean;
  materials?: string;
  whyItWorks: string;
  before: string[];
  during: string[];
  after: string[];
  tips: string[];
  comingSoon?: boolean;
  image?: string;
}

export const ACTIVITIES: Activity[] = [
  {
    id: '2',
    name: 'Coffee Roulette',
    i18nKey: 'activities.coffeeRoulette',
    icon: Coffee,
    image: coffeeRouletteImg,
    category: 'connection',
    type: 'sync',
    description: 'Random 1:1 pairings for virtual coffee chats. Creates cross-team connections and breaks down silos through personal conversation.',
    duration: '30 min',
    durationTag: 'medium',
    teamSize: 'Pairs (2 people)',
    teamSizeTag: 'pairs',
    minPlayers: 2,
    maxPlayers: 2,
    difficulty: 'beginner',
    color: 'text-info',
    bgColor: 'bg-info/10',
    popular: true,
    materials: 'Random pairing tool (we provide free options) or manual matching',
    whyItWorks: "Builds real relationships that go beyond work projects. Reduces isolation in remote work and creates the 'watercooler moments' that remote teams miss.",
    before: [
      'Decide frequency: weekly, bi-weekly, or monthly works best',
      'Use a random pairing tool (Donut for Slack, or manual random matching)',
      "Send calendar invites: 'Virtual Coffee with [Name]' for 30 min",
      'Provide 3-5 conversation starter questions (but make them optional)',
      'Make participation optional but highly encouraged',
    ],
    during: [
      'Join with cameras ON (if comfortable) — seeing faces builds connection',
      "Start casual: 'Hey! How's your week going so far?'",
      'Let conversation flow naturally — no agenda needed',
      'If awkward silence, use conversation starters you provided',
      'Mix of work and personal topics is perfect — whatever feels natural',
      'No need to take notes or report back — this is just connection time',
    ],
    after: [
      'No formal follow-up required — the connection was the goal',
      'Optional: Share one interesting thing you learned in team channel',
      'Schedule next round of pairings for next month with NEW matches',
      'Track participation (who joins) but keep it light and optional',
    ],
    tips: [
      '30 minutes is the sweet spot — not too short, not too long',
      'Avoid pairing direct reports with their managers (power dynamics)',
      'Rotate pairings monthly so everyone meets different people',
      'Provide opt-out option without shame — some people need breaks',
      'Consider time zones when scheduling',
      'This is the most impactful activity for building real relationships',
    ],
  },
  {
    id: '3',
    name: 'Wins of the Week',
    i18nKey: 'activities.winsOfWeek',
    icon: Trophy,
    image: winsOfTheWeekImg,
    category: 'wellness',
    type: 'async',
    description: 'Weekly thread where everyone shares one win from their week — work or personal. Builds positive culture and celebrates progress.',
    duration: 'Ongoing',
    durationTag: 'ongoing',
    teamSize: 'Any size',
    teamSizeTag: 'any',
    minPlayers: 2,
    maxPlayers: 999,
    difficulty: 'beginner',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    popular: true,
    materials: 'Slack or Teams channel',
    whyItWorks: 'Creates a culture of recognition and positivity. Helps team members appreciate each other\'s work. Works perfectly across time zones since it\'s async.',
    before: [
      'Create dedicated #wins-of-the-week channel (or use existing team channel)',
      "Set up recurring Friday reminder (use Slack's scheduled messages)",
      'Lead by example — YOU share first every single week',
      'Set the tone: wins can be work OR personal, big OR small',
    ],
    during: [
      "Friday morning (9-10 AM): Post 'Time to share your wins! What went well this week?'",
      'Throughout the day: Everyone replies with 1 win (work or personal)',
      'React with emojis to EVERY SINGLE POST — participation matters',
      "Keep it light: 'Shipped new feature' AND 'Finally organized my desk' both count",
      'No win is too small — celebrating consistency and effort',
    ],
    after: [
      'Monday morning: Optional recap of highlights from last week',
      'Celebrate weekly participants (people who share consistently)',
      'Repeat every Friday without fail — consistency builds the habit',
      'After 4 weeks, survey team: Is this valuable? Keep going!',
    ],
    tips: [
      'Personal wins are ENCOURAGED not just work (got out of bed counts!)',
      'React to every single post — even just a 🎉 shows you see them',
      'Lead by example — share first every week to set the tone',
      'Make it a habit — same day, same time, every week',
      'If participation drops, remind the team why this matters',
      'This is the easiest async activity and has huge cultural impact',
    ],
  },
  {
    id: '4',
    name: 'Strategic Escape Challenge',
    i18nKey: 'activities.strategicEscape',
    icon: Target,
    image: strategicEscapeImg,
    category: 'competition',
    type: 'async',
    description:
      'An async strategic simulation where your team navigates a realistic crisis scenario from different roles and perspectives.',
    duration: '45-60 min (async)',
    durationTag: 'ongoing',
    teamSize: '4-12 people',
    teamSizeTag: 'medium',
    minPlayers: 4,
    maxPlayers: 12,
    difficulty: 'intermediate',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    popular: true,
    materials: 'Slack/Teams/Notion (or your usual tools)',
    whyItWorks:
      'Simulates real strategic tension without real-world risk. Helps teams practice cross-functional alignment, decision-making under pressure, and resource trade-offs.',
    before: [
      'Choose an industry and crisis that feels realistic for your team.',
      'Invite a cross-functional group (product, engineering, marketing, operations, leadership).',
      'Decide where the async discussion will live (Slack, Teams, Notion, etc.).',
    ],
    during: [
      'Introduce the scenario and make sure everyone understands their secret role.',
      "Give people 2-3 days to share updates, decisions, and trade-offs from their role's perspective.",
      'Encourage short, frequent updates rather than long reports.',
      'Ask people to capture tensions and disagreements explicitly — they are the most valuable part.',
    ],
    after: [
      'Run a 30-45 minute debrief session using the in-product prompts.',
      'Summarize 2-3 key changes you want to make to how you handle real crises.',
      'Share a short written summary with leadership linking insights to concrete actions.',
    ],
    tips: [
      'Make it feel real: use your own product, customers, and timelines in the scenario.',
      'Invite people who rarely sit in the same room together — that is where the magic happens.',
      'Time-box the async window so it stays focused and energetic.',
      "Don't water down tension - disagreement is where the best learning happens.",
    ],
  },
];

export const categoryGradient: Record<string, string> = {
  icebreaker: 'from-primary/60 to-primary',
  connection: 'from-info/60 to-info',
  wellness: 'from-warning/60 to-warning',
  competition: 'from-destructive/60 to-destructive',
};

export const categoryColors: Record<string, string> = {
  icebreaker: 'bg-primary/10 text-primary border-primary/20',
  connection: 'bg-info/10 text-info border-info/20',
  wellness: 'bg-warning/10 text-warning border-warning/20',
  competition: 'bg-destructive/10 text-destructive border-destructive/20',
};
