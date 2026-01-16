import { AIClient } from '../client';

export interface Meeting {
  title: string;
  startTime: string;
  endTime: string;
  attendees: { name: string; email: string; company?: string }[];
  description?: string;
}

export interface DealSummary {
  name: string;
  company: string;
  value: number;
  currency: string;
  stage: string;
  daysSinceLastActivity: number;
  nextSteps?: string;
  riskLevel?: 'low' | 'medium' | 'high';
}

export interface RecentActivity {
  type: 'email' | 'meeting' | 'call' | 'note';
  subject: string;
  contactName: string;
  company?: string;
  timestamp: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface BriefingInput {
  userName: string;
  date: string;
  timezone: string;
  meetings: Meeting[];
  dealsNeedingAttention: DealSummary[];
  recentActivities: RecentActivity[];
  openTasks: { title: string; dueDate?: string; priority: 'low' | 'medium' | 'high' }[];
}

export interface MorningBriefing {
  greeting: string;
  dayAtGlance: string;
  meetingPrepNotes: {
    meetingTitle: string;
    prepPoints: string[];
    suggestedTalkingPoints: string[];
  }[];
  dealsToFocusOn: {
    dealName: string;
    company: string;
    urgency: 'critical' | 'important' | 'routine';
    suggestedAction: string;
  }[];
  taskReminders: string[];
  dailyGoals: string[];
  motivationalNote: string;
}

const BRIEFING_PROMPT = `You are an AI sales assistant generating a personalized morning briefing for a B2B sales professional.

Your briefing should be:
- Actionable and focused on priorities
- Warm but professional in tone
- Aware of GCC business culture (relationship-focused, formal greetings)
- Time-sensitive (highlight urgent items)
- Concise but thorough

Consider the following when generating:
- Deals with high value or approaching close dates need attention
- Meetings with key stakeholders require preparation
- Stale deals (no activity in 7+ days) need follow-up
- Tasks due today or overdue are priority
- Recent negative sentiment activities may need damage control

Format currency appropriately (KWD, AED, SAR, USD).
Use 24-hour time format.
Be specific with suggested actions, not generic advice.

Respond in JSON format only.`;

export class MorningBriefingGenerator {
  constructor(private client: AIClient) {}

  async generate(input: BriefingInput): Promise<MorningBriefing> {
    const userMessage = `Generate a morning briefing for ${input.userName} on ${input.date} (timezone: ${input.timezone}).

TODAY'S MEETINGS:
${input.meetings.length === 0 ? 'No meetings scheduled.' : input.meetings.map(m => `
- ${m.title}
  Time: ${m.startTime} - ${m.endTime}
  Attendees: ${m.attendees.map(a => `${a.name}${a.company ? ` (${a.company})` : ''}`).join(', ')}
  ${m.description ? `Notes: ${m.description}` : ''}
`).join('')}

DEALS NEEDING ATTENTION:
${input.dealsNeedingAttention.length === 0 ? 'No urgent deals.' : input.dealsNeedingAttention.map(d => `
- ${d.name} (${d.company})
  Value: ${d.currency} ${d.value.toLocaleString()}
  Stage: ${d.stage}
  Days since last activity: ${d.daysSinceLastActivity}
  ${d.riskLevel ? `Risk: ${d.riskLevel}` : ''}
  ${d.nextSteps ? `Next steps: ${d.nextSteps}` : ''}
`).join('')}

RECENT ACTIVITIES (last 24 hours):
${input.recentActivities.length === 0 ? 'No recent activities.' : input.recentActivities.map(a => `
- ${a.type.toUpperCase()}: ${a.subject}
  Contact: ${a.contactName}${a.company ? ` (${a.company})` : ''}
  Time: ${a.timestamp}
  ${a.sentiment ? `Sentiment: ${a.sentiment}` : ''}
`).join('')}

OPEN TASKS:
${input.openTasks.length === 0 ? 'No pending tasks.' : input.openTasks.map(t => `
- ${t.title}
  Priority: ${t.priority}
  ${t.dueDate ? `Due: ${t.dueDate}` : ''}
`).join('')}

Return JSON with this structure:
{
  "greeting": "Personalized morning greeting",
  "dayAtGlance": "One paragraph summary of what the day looks like",
  "meetingPrepNotes": [
    {
      "meetingTitle": "Meeting name",
      "prepPoints": ["What to review before", "Key context needed"],
      "suggestedTalkingPoints": ["Discussion topics", "Questions to ask"]
    }
  ],
  "dealsToFocusOn": [
    {
      "dealName": "Deal name",
      "company": "Company name",
      "urgency": "critical|important|routine",
      "suggestedAction": "Specific action to take today"
    }
  ],
  "taskReminders": ["Priority tasks for today"],
  "dailyGoals": ["2-3 achievable goals for today"],
  "motivationalNote": "Brief encouraging note for the day"
}`;

    const result = await this.client.completeJSON<MorningBriefing>(
      BRIEFING_PROMPT,
      userMessage,
      { maxTokens: 2048 },
    );

    return result || this.getDefaultBriefing(input);
  }

  async generateSlackMessage(input: BriefingInput): Promise<string> {
    const briefing = await this.generate(input);
    return this.formatForSlack(briefing, input);
  }

  private formatForSlack(briefing: MorningBriefing, input: BriefingInput): string {
    const sections: string[] = [];

    // Greeting
    sections.push(briefing.greeting);
    sections.push('');

    // Day at a glance
    sections.push(`*Your Day at a Glance*`);
    sections.push(briefing.dayAtGlance);
    sections.push('');

    // Meetings
    if (briefing.meetingPrepNotes.length > 0) {
      sections.push(`*Meetings Today* (${input.meetings.length})`);
      for (const meeting of briefing.meetingPrepNotes) {
        sections.push(`> *${meeting.meetingTitle}*`);
        if (meeting.prepPoints.length > 0) {
          sections.push(`> Prep: ${meeting.prepPoints.join('; ')}`);
        }
        if (meeting.suggestedTalkingPoints.length > 0) {
          sections.push(`> Talk about: ${meeting.suggestedTalkingPoints.join('; ')}`);
        }
      }
      sections.push('');
    }

    // Deals
    if (briefing.dealsToFocusOn.length > 0) {
      sections.push(`*Deals to Focus On*`);
      for (const deal of briefing.dealsToFocusOn) {
        const urgencyEmoji = deal.urgency === 'critical' ? ':red_circle:' :
                            deal.urgency === 'important' ? ':large_yellow_circle:' : ':white_circle:';
        sections.push(`${urgencyEmoji} *${deal.dealName}* (${deal.company})`);
        sections.push(`   Action: ${deal.suggestedAction}`);
      }
      sections.push('');
    }

    // Tasks
    if (briefing.taskReminders.length > 0) {
      sections.push(`*Tasks for Today*`);
      for (const task of briefing.taskReminders) {
        sections.push(`- [ ] ${task}`);
      }
      sections.push('');
    }

    // Goals
    if (briefing.dailyGoals.length > 0) {
      sections.push(`*Daily Goals*`);
      for (const goal of briefing.dailyGoals) {
        sections.push(`:dart: ${goal}`);
      }
      sections.push('');
    }

    // Motivational note
    sections.push(`_${briefing.motivationalNote}_`);

    return sections.join('\n');
  }

  private getDefaultBriefing(input: BriefingInput): MorningBriefing {
    return {
      greeting: `Good morning, ${input.userName}! Here's your briefing for ${input.date}.`,
      dayAtGlance: `You have ${input.meetings.length} meeting(s) scheduled, ${input.dealsNeedingAttention.length} deal(s) needing attention, and ${input.openTasks.length} task(s) pending.`,
      meetingPrepNotes: input.meetings.map(m => ({
        meetingTitle: m.title,
        prepPoints: ['Review previous communications'],
        suggestedTalkingPoints: ['Discuss next steps'],
      })),
      dealsToFocusOn: input.dealsNeedingAttention.slice(0, 3).map(d => ({
        dealName: d.name,
        company: d.company,
        urgency: d.daysSinceLastActivity > 7 ? 'important' as const : 'routine' as const,
        suggestedAction: 'Follow up with contact',
      })),
      taskReminders: input.openTasks.filter(t => t.priority === 'high').map(t => t.title),
      dailyGoals: ['Complete priority tasks', 'Follow up on stale deals'],
      motivationalNote: 'Have a productive day!',
    };
  }
}
