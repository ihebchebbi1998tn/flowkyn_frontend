import { MessageSquare, Coffee, Trophy, Target, Users, Lightbulb } from 'lucide-react';

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
  icon: typeof MessageSquare;
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
}

export const ACTIVITIES: Activity[] = [
  {
    id: '1',
    name: 'Two Truths and a Lie',
    i18nKey: 'activities.twoTruths',
    icon: MessageSquare,
    category: 'icebreaker',
    type: 'sync',
    description: 'Classic icebreaker where each person shares three statements — two truths and one lie. Team guesses which is the lie.',
    duration: '15 min',
    durationTag: 'quick',
    teamSize: '5–30 people',
    teamSizeTag: 'medium',
    minPlayers: 5,
    maxPlayers: 30,
    difficulty: 'beginner',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    popular: true,
    materials: 'None',
    whyItWorks: "The ultimate icebreaker. Everyone knows it, it's easy to run, and it always works. Perfect way to start any meeting or get to know new team members.",
    before: [
      'Send calendar invite with clear instructions',
      'Ask everyone to prepare 2 truths and 1 lie about themselves',
      'Remind them to make the lie believable but not impossible to guess',
    ],
    during: [
      "Go first as the host to set the tone and show it's okay to be playful",
      'Each person shares their 3 statements clearly',
      'Give team 30 seconds to discuss and vote in chat',
      'Person reveals which was the lie and shares context on the truths',
      'Move to next person — keep energy high and moving',
      'Limit to 2–3 minutes per person maximum',
    ],
    after: [
      'Thank everyone for sharing and being vulnerable',
      "Ask: 'What surprised you most that you learned?'",
      'Optional: Share a fun recap in Slack with interesting facts learned',
    ],
    tips: [
      'Go first as the host to model vulnerability and set the right tone',
      "Encourage creative, interesting lies (not just 'I don't like pizza')",
      'Keep it moving — max 2–3 min per person, use a timer if needed',
      'If someone is struggling, offer to skip and come back to them',
      'Works great for new teams OR teams that think they know each other',
    ],
  },
  {
    id: '2',
    name: 'Coffee Roulette',
    i18nKey: 'activities.coffeeRoulette',
    icon: Coffee,
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
      'Provide 3–5 conversation starter questions (but make them optional)',
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
    category: 'wellness',
    type: 'async',
    description: 'Weekly Slack/Teams thread where everyone shares one win from their week — work or personal. Builds positive culture and celebrates progress.',
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
      "Friday morning (9–10 AM): Post 'Time to share your wins! What went well this week?'",
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
    category: 'competition',
    type: 'async',
    description:
      'An async strategic simulation where your team navigates a realistic crisis scenario from different roles and perspectives.',
    duration: '45–60 min (async)',
    durationTag: 'ongoing',
    teamSize: '4–12 people',
    teamSizeTag: 'medium',
    minPlayers: 4,
    maxPlayers: 12,
    difficulty: 'intermediate',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    popular: true,
    materials: 'Slack/Teams/Notion (or your usual tools)',
    whyItWorks:
      'Simulates real strategic tension without real‑world risk. Helps teams practice cross‑functional alignment, decision‑making under pressure, and resource trade‑offs.',
    before: [
      'Choose an industry and crisis that feels realistic for your team.',
      'Invite a cross‑functional group (product, engineering, marketing, operations, leadership).',
      'Decide where the async discussion will live (Slack, Teams, Notion, etc.).',
    ],
    during: [
      'Introduce the scenario and make sure everyone understands their secret role.',
      'Give people 2–3 days to share updates, decisions, and trade‑offs from their role’s perspective.',
      'Encourage short, frequent updates rather than long reports.',
      'Ask people to capture tensions and disagreements explicitly — they are the most valuable part.',
    ],
    after: [
      'Run a 30–45 minute debrief session using the in‑product prompts.',
      'Summarize 2–3 key changes you want to make to how you handle real crises.',
      'Share a short written summary with leadership linking insights to concrete actions.',
    ],
    tips: [
      'Make it feel real: use your own product, customers, and timelines in the scenario.',
      'Invite people who rarely sit in the same room together — that is where the magic happens.',
      'Time‑box the async window so it stays focused and energetic.',
      'Don’t water down tension — disagreement is where the best learning happens.',
    ],
  },
  {
    id: '7',
    name: 'Decision Jam',
    i18nKey: 'activities.decisionJam',
    icon: Users,
    category: 'connection',
    type: 'sync',
    description:
      'A structured 40-minute alignment ritual for distributed teams: surface blockers, debate options quickly, and leave with clear owners and next actions.',
    duration: '40 min',
    durationTag: 'medium',
    teamSize: '4–10 people',
    teamSizeTag: 'medium',
    minPlayers: 4,
    maxPlayers: 10,
    difficulty: 'intermediate',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    materials: 'Video call + shared board',
    whyItWorks:
      'Remote teams often lose time in unclear decisions. Decision Jam creates predictable decision hygiene, faster alignment, and stronger accountability.',
    before: [
      'Collect 2–3 decision topics with clear context from async docs.',
      'Assign one facilitator and one note owner.',
      'Set a strict agenda with timeboxes per decision.',
    ],
    during: [
      'Clarify decision scope and constraints first.',
      'Use a short round-robin so every function is heard.',
      'Converge to one decision, owner, and deadline per topic.',
    ],
    after: [
      'Publish a concise decision log to your team channel.',
      'Track action owners with due dates.',
      'Review outcomes in the next weekly sync.',
    ],
    tips: [
      'Keep discussions evidence-based, not opinion-only.',
      'Timebox debate; don’t timebox decision quality.',
      'Always capture owner + due date before closing a topic.',
    ],
    comingSoon: true,
  },
  {
    id: '8',
    name: 'Culture Snapshot',
    i18nKey: 'activities.cultureSnapshot',
    icon: Lightbulb,
    category: 'wellness',
    type: 'async',
    description:
      'An async team pulse that turns weekly sentiment, blockers, and small wins into one shared culture map with practical follow-up actions.',
    duration: 'Weekly async',
    durationTag: 'ongoing',
    teamSize: 'Any size',
    teamSizeTag: 'any',
    minPlayers: 3,
    maxPlayers: 999,
    difficulty: 'beginner',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    materials: 'Slack/Teams + survey prompts',
    whyItWorks:
      'Fully remote teams need lightweight rhythm to detect friction early. Culture Snapshot gives visibility without meeting overload and keeps morale actionable.',
    before: [
      'Pick a consistent weekly window for submissions.',
      'Prepare 3 short prompts: sentiment, blocker, win.',
      'Set expectation: concise and honest responses.',
    ],
    during: [
      'Collect responses asynchronously across time zones.',
      'Cluster themes and highlight recurring blockers.',
      'Share one visual summary with top actions.',
    ],
    after: [
      'Assign 1–2 concrete improvements for the next week.',
      'Close the loop publicly on previous actions.',
      'Track trend lines over time.',
    ],
    tips: [
      'Keep prompts stable for trend quality.',
      'Protect anonymity when needed.',
      'Focus on small improvements with visible follow-through.',
    ],
    comingSoon: true,
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
