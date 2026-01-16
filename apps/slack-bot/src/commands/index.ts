import { App } from '@slack/bolt';
import { DataSource } from 'typeorm';
import { Contact, Deal, Activity } from '@invicrm/database';
import { AIClient, NaturalLanguageParser } from '@invicrm/ai-client';
import { SlackInstallationStore } from '../stores/installation-store';
import { formatCurrency } from '@invicrm/shared';

export function registerCommands(app: App, db: DataSource) {
  const installationStore = new SlackInstallationStore(db);
  const contactRepo = db.getRepository(Contact);
  const dealRepo = db.getRepository(Deal);
  const activityRepo = db.getRepository(Activity);

  // Initialize AI client if available
  let nlParser: NaturalLanguageParser | null = null;
  if (process.env.ANTHROPIC_API_KEY) {
    const aiClient = new AIClient({ apiKey: process.env.ANTHROPIC_API_KEY });
    nlParser = new NaturalLanguageParser(aiClient);
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

    if (!query) {
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
              text: '• "What\'s happening with [contact name]?"\n• "Show my deals closing this month"\n• "Who haven\'t I contacted in 2 weeks?"\n• "Just had a call with [name] about [topic]"',
            },
          },
        ],
        response_type: 'ephemeral',
      });
      return;
    }

    // Parse the natural language query
    if (nlParser) {
      try {
        const parsed = await nlParser.parseQuery(query);

        switch (parsed.intent) {
          case 'contact_lookup':
            await handleContactLookup(parsed.entities.contactName || '', tenantId, respond);
            break;
          case 'deals_list':
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
              text: `I'm not sure how to help with that. Try asking about a contact, deal, or your pipeline.`,
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

  // Deals list handler
  async function handleDealsList(tenantId: string, timeframe: string | undefined, respond: any) {
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
