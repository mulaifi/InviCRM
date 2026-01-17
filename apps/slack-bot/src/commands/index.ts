import { App } from '@slack/bolt';
import { DataSource } from 'typeorm';
import { Contact, Deal, Activity, Task } from '@invicrm/database';
import { AIClient, NaturalLanguageParser, MorningBriefingGenerator, type BriefingInput, type AIProvider } from '@invicrm/ai-client';
import { SlackInstallationStore } from '../stores/installation-store';
import { formatCurrency } from '@invicrm/shared';

export function registerCommands(app: App, db: DataSource) {
  const installationStore = new SlackInstallationStore(db);
  const contactRepo = db.getRepository(Contact);
  const dealRepo = db.getRepository(Deal);
  const activityRepo = db.getRepository(Activity);
  const taskRepo = db.getRepository(Task);

  // Initialize AI client if available (supports Anthropic, Ollama, or OpenAI-compatible)
  let nlParser: NaturalLanguageParser | null = null;
  let briefingGenerator: MorningBriefingGenerator | null = null;

  const aiProvider = (process.env.AI_PROVIDER || 'anthropic') as AIProvider;
  const hasAI = aiProvider === 'ollama' ||
    aiProvider === 'openai' ||
    (aiProvider === 'anthropic' && process.env.ANTHROPIC_API_KEY);

  if (hasAI) {
    const aiClient = new AIClient({
      provider: aiProvider,
      apiKey: process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY,
      baseUrl: process.env.AI_BASE_URL,
      model: process.env.AI_MODEL,
    });
    console.log(`AI initialized: provider=${aiProvider}, model=${aiClient.getModel()}`);
    nlParser = new NaturalLanguageParser(aiClient);
    briefingGenerator = new MorningBriefingGenerator(aiClient);
  }

  // Main slash command: /leancrm
  app.command('/leancrm', async ({ command, ack, respond, client }) => {
    await ack();

    const teamId = command.team_id;
    const tenantId = await installationStore.getTenantId(teamId);

    if (!tenantId) {
      await respond({
        text: 'This Slack workspace is not linked to an InviCRM account. Please contact your admin to complete setup.',
        response_type: 'ephemeral',
      });
      return;
    }

    const query = command.text.trim();

    if (!query || query === 'help') {
      await respond({
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*InviCRM Commands*\n\nYou can ask me things like:',
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '• `/leancrm brief` - Get your morning briefing\n• "What\'s happening with [contact name]?"\n• "Show my deals closing this month"\n• "Who haven\'t I contacted in 2 weeks?"\n• "Just had a call with [name] about [topic]"',
            },
          },
        ],
        response_type: 'ephemeral',
      });
      return;
    }

    // Handle direct commands
    if (query.toLowerCase() === 'brief' || query.toLowerCase() === 'briefing') {
      await handleMorningBriefing(tenantId, command.user_id, respond, client);
      return;
    }

    // Parse the natural language query
    console.log('nlParser available:', !!nlParser, 'briefingGenerator:', !!briefingGenerator);
    if (nlParser) {
      try {
        const parsed = await nlParser.parseQuery(query);
        console.log('NL Parser result:', JSON.stringify(parsed, null, 2));

        switch (parsed.intent) {
          case 'contact_lookup':
            await handleContactLookup(parsed.entities.contactName || '', tenantId, respond);
            break;
          case 'company_lookup':
            await handleCompanyLookup(parsed.entities.companyName || '', tenantId, respond);
            break;
          case 'deal_status':
            await handleDealStatus(parsed.entities.dealName || parsed.entities.companyName || '', tenantId, respond);
            break;
          case 'deals_list':
          case 'pipeline_overview':
            await handleDealsList(tenantId, parsed.entities.timeframe, respond);
            break;
          case 'relationship_status':
            await handleStaleContacts(tenantId, parsed.entities.timeframe || '2 weeks', respond);
            break;
          case 'activity_log':
            await respond({
              text: `I understood you want to log an activity. This feature is coming soon!`,
              response_type: 'ephemeral',
            });
            break;
          default:
            await respond({
              text: `I'm not sure how to help with that (intent: ${parsed.intent}). Try asking about a contact, deal, or your pipeline.`,
              response_type: 'ephemeral',
            });
        }
      } catch (error) {
        console.error('Error processing query:', error);
        await respond({
          text: 'Sorry, I had trouble processing that request. Please try again.',
          response_type: 'ephemeral',
        });
      }
    } else {
      // Fallback without AI - basic keyword matching
      await handleBasicQuery(query, tenantId, respond);
    }
  });

  // Contact lookup handler
  async function handleContactLookup(name: string, tenantId: string, respond: any) {
    const contacts = await contactRepo
      .createQueryBuilder('contact')
      .leftJoinAndSelect('contact.company', 'company')
      .where('contact.tenant_id = :tenantId', { tenantId })
      .andWhere('contact.is_deleted = false')
      .andWhere(
        '(LOWER(contact.first_name) LIKE :name OR LOWER(contact.last_name) LIKE :name)',
        { name: `%${name.toLowerCase()}%` },
      )
      .limit(5)
      .getMany();

    if (contacts.length === 0) {
      await respond({
        text: `I couldn't find any contacts matching "${name}".`,
        response_type: 'ephemeral',
      });
      return;
    }

    const contact = contacts[0];

    // Get recent activities
    const activities = await activityRepo.find({
      where: { contactId: contact.id, tenantId, isDeleted: false },
      order: { occurredAt: 'DESC' },
      take: 5,
    });

    // Get deals
    const deals = await dealRepo.find({
      where: { contactId: contact.id, tenantId, isDeleted: false, status: 'open' },
      relations: ['stage'],
    });

    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${contact.firstName} ${contact.lastName || ''}`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Email:*\n${contact.email || 'N/A'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Company:*\n${contact.company?.name || 'N/A'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Title:*\n${contact.title || 'N/A'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Last Contact:*\n${contact.lastContactedAt ? formatRelativeDate(contact.lastContactedAt) : 'Never'}`,
          },
        ],
      },
    ];

    if (deals.length > 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Open Deals (${deals.length}):*\n${deals.map(d => `• ${d.name} - ${formatCurrency(d.amount || 0, 'KWD')} (${d.stage?.name || 'Unknown stage'})`).join('\n')}`,
        },
      });
    }

    if (activities.length > 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Recent Activity:*\n${activities.map(a => `• ${a.type}: ${a.subject} (${formatRelativeDate(a.occurredAt)})`).join('\n')}`,
        },
      });
    }

    await respond({
      blocks,
      response_type: 'ephemeral',
    });
  }

  // Company lookup handler
  async function handleCompanyLookup(name: string, tenantId: string, respond: any) {
    // Search for company by name, abbreviation, or initials
    // Also match abbreviations like NBK -> National Bank of Kuwait
    const searchTerm = name.toLowerCase();
    const companies = await db.query(
      `SELECT c.*,
        (SELECT COUNT(*) FROM contacts WHERE company_id = c.id AND is_deleted = false) as contact_count,
        (SELECT COUNT(*) FROM deals WHERE company_id = c.id AND is_deleted = false AND status = 'open') as deal_count,
        (SELECT SUM(amount) FROM deals WHERE company_id = c.id AND is_deleted = false AND status = 'open') as pipeline_value
       FROM companies c
       WHERE c.tenant_id = $1 AND c.is_deleted = false
       AND (
         LOWER(c.name) LIKE $2
         OR LOWER(c.name) LIKE $3
         OR (
           -- Match initials: NBK matches "National Bank of Kuwait" (skip common words)
           LENGTH($4) >= 2 AND LENGTH($4) <= 5 AND UPPER($4) = (
             SELECT string_agg(UPPER(LEFT(word, 1)), '')
             FROM unnest(string_to_array(c.name, ' ')) AS word
             WHERE word != '' AND LOWER(word) NOT IN ('of', 'the', 'and', 'for', 'in', 'at', 'to', 'a', 'an')
           )
         )
       )
       LIMIT 5`,
      [tenantId, `%${searchTerm}%`, `${searchTerm}%`, name.toUpperCase()]
    );

    if (companies.length === 0) {
      await respond({
        text: `I couldn't find any companies matching "${name}".`,
        response_type: 'ephemeral',
      });
      return;
    }

    const company = companies[0];

    // Get recent activities for this company (via contacts)
    const activities = await activityRepo
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.contact', 'contact')
      .where('contact.company_id = :companyId', { companyId: company.id })
      .andWhere('activity.is_deleted = false')
      .orderBy('activity.occurred_at', 'DESC')
      .limit(5)
      .getMany();

    // Get open deals for this company
    const deals = await dealRepo.find({
      where: { companyId: company.id, tenantId, isDeleted: false, status: 'open' },
      relations: ['stage', 'contact'],
      order: { expectedCloseDate: 'ASC' },
    });

    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: company.name,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Industry:*\n${company.industry || 'N/A'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Contacts:*\n${company.contact_count || 0}`,
          },
          {
            type: 'mrkdwn',
            text: `*Open Deals:*\n${company.deal_count || 0}`,
          },
          {
            type: 'mrkdwn',
            text: `*Pipeline Value:*\n${formatCurrency(company.pipeline_value || 0, 'KWD')}`,
          },
        ],
      },
    ];

    if (deals.length > 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Open Deals:*\n${deals.map(d => `• ${d.name} - ${formatCurrency(d.amount || 0, 'KWD')} (${d.stage?.name || 'Unknown'})`).join('\n')}`,
        },
      });
    }

    if (activities.length > 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Recent Activity:*\n${activities.map(a => `• ${a.type}: ${a.subject} (${formatRelativeDate(a.occurredAt)})`).join('\n')}`,
        },
      });
    }

    await respond({
      blocks,
      response_type: 'ephemeral',
    });
  }

  // Deal status handler
  async function handleDealStatus(name: string, tenantId: string, respond: any) {
    const deals = await dealRepo
      .createQueryBuilder('deal')
      .leftJoinAndSelect('deal.contact', 'contact')
      .leftJoinAndSelect('deal.company', 'company')
      .leftJoinAndSelect('deal.stage', 'stage')
      .where('deal.tenant_id = :tenantId', { tenantId })
      .andWhere('deal.is_deleted = false')
      .andWhere('(LOWER(deal.name) LIKE :name OR LOWER(company.name) LIKE :name)', { name: `%${name.toLowerCase()}%` })
      .limit(5)
      .getMany();

    if (deals.length === 0) {
      await respond({
        text: `I couldn't find any deals matching "${name}".`,
        response_type: 'ephemeral',
      });
      return;
    }

    const deal = deals[0];

    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: deal.name,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Value:*\n${formatCurrency(deal.amount || 0, (deal.currency as 'KWD' | 'USD' | 'AED') || 'KWD')}`,
          },
          {
            type: 'mrkdwn',
            text: `*Stage:*\n${deal.stage?.name || 'Unknown'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Probability:*\n${deal.probability}%`,
          },
          {
            type: 'mrkdwn',
            text: `*Expected Close:*\n${deal.expectedCloseDate ? formatRelativeDate(deal.expectedCloseDate) : 'Not set'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Company:*\n${deal.company?.name || 'N/A'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Contact:*\n${deal.contact ? `${deal.contact.firstName} ${deal.contact.lastName || ''}` : 'N/A'}`,
          },
        ],
      },
    ];

    await respond({
      blocks,
      response_type: 'ephemeral',
    });
  }

  // Deals list handler
  async function handleDealsList(tenantId: string, _timeframe: string | undefined, respond: any) {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const deals = await dealRepo
      .createQueryBuilder('deal')
      .leftJoinAndSelect('deal.contact', 'contact')
      .leftJoinAndSelect('deal.company', 'company')
      .leftJoinAndSelect('deal.stage', 'stage')
      .where('deal.tenant_id = :tenantId', { tenantId })
      .andWhere('deal.is_deleted = false')
      .andWhere('deal.status = :status', { status: 'open' })
      .andWhere('deal.expected_close_date <= :endDate', { endDate: endOfMonth })
      .orderBy('deal.expected_close_date', 'ASC')
      .limit(10)
      .getMany();

    if (deals.length === 0) {
      await respond({
        text: 'No deals closing this month.',
        response_type: 'ephemeral',
      });
      return;
    }

    const totalValue = deals.reduce((sum, d) => sum + (d.amount || 0), 0);
    const weightedValue = deals.reduce((sum, d) => sum + (d.amount || 0) * (d.probability / 100), 0);

    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `Deals Closing This Month (${deals.length})`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Total Value:*\n${formatCurrency(totalValue, 'KWD')}`,
          },
          {
            type: 'mrkdwn',
            text: `*Weighted Value:*\n${formatCurrency(weightedValue, 'KWD')}`,
          },
        ],
      },
      { type: 'divider' },
    ];

    for (const deal of deals) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${deal.name}*\n${formatCurrency(deal.amount || 0, 'KWD')} • ${deal.stage?.name || 'Unknown'} • ${deal.probability}%\n${deal.contact ? `${deal.contact.firstName} ${deal.contact.lastName || ''}` : deal.company?.name || 'No contact'}`,
        },
      });
    }

    await respond({
      blocks,
      response_type: 'ephemeral',
    });
  }

  // Stale contacts handler
  async function handleStaleContacts(tenantId: string, timeframe: string, respond: any) {
    const days = parseTimeframeToDays(timeframe);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const staleContacts = await contactRepo
      .createQueryBuilder('contact')
      .leftJoinAndSelect('contact.company', 'company')
      .where('contact.tenant_id = :tenantId', { tenantId })
      .andWhere('contact.is_deleted = false')
      .andWhere('(contact.last_contacted_at < :cutoff OR contact.last_contacted_at IS NULL)', { cutoff: cutoffDate })
      .orderBy('contact.last_contacted_at', 'ASC', 'NULLS FIRST')
      .limit(10)
      .getMany();

    if (staleContacts.length === 0) {
      await respond({
        text: `Great news! You've contacted everyone within the last ${days} days.`,
        response_type: 'ephemeral',
      });
      return;
    }

    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `Contacts not reached in ${days} days (${staleContacts.length})`,
        },
      },
    ];

    for (const contact of staleContacts) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${contact.firstName} ${contact.lastName || ''}*${contact.company ? ` - ${contact.company.name}` : ''}\nLast contact: ${contact.lastContactedAt ? formatRelativeDate(contact.lastContactedAt) : 'Never'}`,
        },
      });
    }

    await respond({
      blocks,
      response_type: 'ephemeral',
    });
  }

  // Morning briefing handler
  async function handleMorningBriefing(tenantId: string, slackUserId: string, respond: any, client: any) {
    if (!briefingGenerator) {
      await respond({
        text: 'Morning briefings require AI features. Please contact your admin to configure the Anthropic API key.',
        response_type: 'ephemeral',
      });
      return;
    }

    await respond({
      text: ':coffee: Preparing your morning briefing...',
      response_type: 'ephemeral',
    });

    try {
      // Get user info from Slack
      const slackUserInfo = await client.users.info({ user: slackUserId });
      // TODO: Use slackUserInfo.user?.profile?.email to find CRM user and filter by assigned deals/contacts

      const userName = slackUserInfo.user?.profile?.real_name || 'there';
      const timezone = slackUserInfo.user?.tz || 'Asia/Kuwait';

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Fetch today's meetings (from activities of type 'meeting' scheduled for today)
      const meetings = await activityRepo
        .createQueryBuilder('activity')
        .leftJoinAndSelect('activity.contact', 'contact')
        .leftJoinAndSelect('contact.company', 'company')
        .where('activity.tenant_id = :tenantId', { tenantId })
        .andWhere('activity.type = :type', { type: 'meeting' })
        .andWhere('activity.is_deleted = false')
        .andWhere('DATE(activity.occurred_at) = :today', { today })
        .orderBy('activity.occurred_at', 'ASC')
        .getMany();

      // Fetch deals needing attention (stale > 7 days, or high value)
      const staleDeals = await dealRepo
        .createQueryBuilder('deal')
        .leftJoinAndSelect('deal.contact', 'contact')
        .leftJoinAndSelect('deal.company', 'company')
        .leftJoinAndSelect('deal.stage', 'stage')
        .where('deal.tenant_id = :tenantId', { tenantId })
        .andWhere('deal.is_deleted = false')
        .andWhere('deal.status = :status', { status: 'open' })
        .andWhere('(deal.updated_at < :staleDate OR deal.amount > :highValue)', {
          staleDate: sevenDaysAgo,
          highValue: 50000,
        })
        .orderBy('deal.amount', 'DESC')
        .limit(5)
        .getMany();

      // Fetch recent activities (last 24 hours)
      const recentActivities = await activityRepo
        .createQueryBuilder('activity')
        .leftJoinAndSelect('activity.contact', 'contact')
        .leftJoinAndSelect('contact.company', 'company')
        .where('activity.tenant_id = :tenantId', { tenantId })
        .andWhere('activity.is_deleted = false')
        .andWhere('activity.occurred_at > :yesterday', { yesterday })
        .orderBy('activity.occurred_at', 'DESC')
        .limit(10)
        .getMany();

      // Fetch open tasks
      const openTasks = await taskRepo
        .createQueryBuilder('task')
        .where('task.tenant_id = :tenantId', { tenantId })
        .andWhere('task.is_deleted = false')
        .andWhere('task.status != :completed', { completed: 'completed' })
        .orderBy('task.priority', 'DESC')
        .addOrderBy('task.due_date', 'ASC')
        .limit(10)
        .getMany();

      // Build briefing input
      const briefingInput: BriefingInput = {
        userName,
        date: new Date().toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        timezone,
        meetings: meetings.map(m => ({
          title: m.subject,
          startTime: m.occurredAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          endTime: m.occurredAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          attendees: m.contact
            ? [{ name: `${m.contact.firstName} ${m.contact.lastName || ''}`, email: m.contact.email || '', company: m.contact.company?.name }]
            : [],
          description: m.body,
        })),
        dealsNeedingAttention: staleDeals.map(d => ({
          name: d.name,
          company: d.company?.name || 'Unknown',
          value: d.amount || 0,
          currency: 'KWD',
          stage: d.stage?.name || 'Unknown',
          daysSinceLastActivity: Math.floor((now.getTime() - d.updatedAt.getTime()) / (1000 * 60 * 60 * 24)),
          riskLevel: d.amount && d.amount > 100000 ? 'high' as const : 'medium' as const,
        })),
        recentActivities: recentActivities.map(a => ({
          type: a.type as 'email' | 'meeting' | 'call' | 'note',
          subject: a.subject,
          contactName: a.contact ? `${a.contact.firstName} ${a.contact.lastName || ''}` : 'Unknown',
          company: a.contact?.company?.name,
          timestamp: a.occurredAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        })),
        openTasks: openTasks.map(t => ({
          title: t.title,
          dueDate: t.dueDate?.toLocaleDateString('en-GB'),
          priority: t.priority as 'low' | 'medium' | 'high',
        })),
      };

      // Generate the briefing
      const briefingMessage = await briefingGenerator.generateSlackMessage(briefingInput);

      await respond({
        text: briefingMessage,
        response_type: 'ephemeral',
      });
    } catch (error) {
      console.error('Error generating morning briefing:', error);
      await respond({
        text: 'Sorry, I had trouble generating your briefing. Please try again.',
        response_type: 'ephemeral',
      });
    }
  }

  // Basic query handler (fallback without AI)
  async function handleBasicQuery(query: string, tenantId: string, respond: any) {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('deal') && lowerQuery.includes('month')) {
      await handleDealsList(tenantId, 'this month', respond);
    } else if (lowerQuery.includes('contact') || lowerQuery.includes('haven\'t')) {
      await handleStaleContacts(tenantId, '2 weeks', respond);
    } else {
      // Try to find a contact by name
      const words = query.split(' ').filter(w => w.length > 2);
      for (const word of words) {
        const contacts = await contactRepo
          .createQueryBuilder('contact')
          .where('contact.tenant_id = :tenantId', { tenantId })
          .andWhere('contact.is_deleted = false')
          .andWhere(
            '(LOWER(contact.first_name) LIKE :name OR LOWER(contact.last_name) LIKE :name)',
            { name: `%${word.toLowerCase()}%` },
          )
          .limit(1)
          .getMany();

        if (contacts.length > 0) {
          await handleContactLookup(word, tenantId, respond);
          return;
        }
      }

      await respond({
        text: `I couldn't understand that query. Try asking about a contact by name, your deals this month, or who you haven't contacted recently.`,
        response_type: 'ephemeral',
      });
    }
  }
}

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

function parseTimeframeToDays(timeframe: string): number {
  const lower = timeframe.toLowerCase();
  const match = lower.match(/(\d+)\s*(day|week|month)/);
  if (match) {
    const num = parseInt(match[1], 10);
    const unit = match[2];
    if (unit.startsWith('week')) return num * 7;
    if (unit.startsWith('month')) return num * 30;
    return num;
  }
  return 14; // Default 2 weeks
}
