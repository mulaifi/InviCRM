import { App } from '@slack/bolt';
import { DataSource } from 'typeorm';
import { Contact, Activity, Task } from '@invicrm/database';
import { AIClient, NaturalLanguageParser } from '@invicrm/ai-client';
import { SlackInstallationStore } from '../stores/installation-store';

export function registerMessageHandlers(app: App, db: DataSource) {
  const installationStore = new SlackInstallationStore(db);
  const contactRepo = db.getRepository(Contact);
  const activityRepo = db.getRepository(Activity);
  const taskRepo = db.getRepository(Task);

  // Initialize AI client if available
  let nlParser: NaturalLanguageParser | null = null;
  if (process.env.ANTHROPIC_API_KEY) {
    const aiClient = new AIClient({ apiKey: process.env.ANTHROPIC_API_KEY });
    nlParser = new NaturalLanguageParser(aiClient);
  }

  // Handle direct messages
  app.message(async ({ message, say, context }) => {
    // Only handle direct messages (not channel messages)
    if (message.channel_type !== 'im') return;

    // Type guard for message with text
    if (!('text' in message) || !message.text) return;

    const teamId = context.teamId;
    if (!teamId) return;

    const tenantId = await installationStore.getTenantId(teamId);
    if (!tenantId) {
      await say('This workspace is not linked to an InviCRM account. Please ask your admin to complete setup.');
      return;
    }

    const text = message.text.trim();

    // Check for activity logging patterns
    const activityPatterns = [
      /^just (had|finished|completed) (a |an )?(call|meeting|chat)/i,
      /^(called|met|spoke) with/i,
      /^had (a |an )?(quick |brief )?(call|meeting|chat)/i,
    ];

    const isActivityLog = activityPatterns.some((pattern) => pattern.test(text));

    if (isActivityLog && nlParser) {
      try {
        const parsed = await nlParser.parseActivityLog(text);
        if (parsed && parsed.confidence > 0.5) {
          // Try to find the contact
          let contact: Contact | null = null;
          if (parsed.contactName) {
            const contacts = await contactRepo
              .createQueryBuilder('contact')
              .where('contact.tenant_id = :tenantId', { tenantId })
              .andWhere('contact.is_deleted = false')
              .andWhere(
                '(LOWER(contact.first_name) LIKE :name OR LOWER(contact.last_name) LIKE :name)',
                { name: `%${parsed.contactName.toLowerCase()}%` },
              )
              .limit(1)
              .getMany();
            contact = contacts[0] || null;
          }

          // Create the activity
          const activity = activityRepo.create({
            tenantId,
            type: parsed.type,
            subject: parsed.subject,
            body: parsed.notes,
            contactId: contact?.id,
            occurredAt: new Date(),
            durationMinutes: parsed.duration,
            source: 'slack',
          });
          await activityRepo.save(activity);

          // Update contact's last contacted date
          if (contact) {
            contact.lastContactedAt = new Date();
            await contactRepo.save(contact);
          }

          await say({
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `Got it! I've logged a ${parsed.type}${contact ? ` with ${contact.firstName} ${contact.lastName || ''}` : ''}.`,
                },
              },
              {
                type: 'context',
                elements: [
                  {
                    type: 'mrkdwn',
                    text: `*Subject:* ${parsed.subject}${parsed.notes ? `\n*Notes:* ${parsed.notes}` : ''}`,
                  },
                ],
              },
            ],
          });
          return;
        }
      } catch (error) {
        console.error('Error parsing activity:', error);
      }
    }

    // Check for reminder patterns
    const reminderPatterns = [
      /^remind me to/i,
      /^set a reminder/i,
      /^don't let me forget/i,
    ];

    const isReminder = reminderPatterns.some((pattern) => pattern.test(text));

    if (isReminder) {
      // Parse reminder using AI or basic pattern matching
      const reminderMatch = text.match(
        /remind me to (.+?)(?:\s+(?:on|at|in|by|tomorrow|next))?/i,
      );

      if (reminderMatch) {
        const taskTitle = reminderMatch[1];

        // Try to extract date
        let dueDate: Date | undefined;
        if (text.includes('tomorrow')) {
          dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 1);
          dueDate.setHours(9, 0, 0, 0);
        } else if (text.includes('next week')) {
          dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 7);
          dueDate.setHours(9, 0, 0, 0);
        }

        // Note: We'd need to map Slack user to InviCRM user
        // For now, create task without assignment
        const task = taskRepo.create({
          tenantId,
          title: taskTitle,
          dueDate,
          status: 'pending',
          priority: 'medium',
        });
        await taskRepo.save(task);

        await say({
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `Reminder set: *${taskTitle}*${dueDate ? `\nDue: ${dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}`,
              },
            },
          ],
        });
        return;
      }
    }

    // Default response for unrecognized messages
    await say({
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: "I'm not sure what you'd like me to do. Here are some things you can try:",
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '• "Just had a call with Sarah about the proposal"\n• "Remind me to follow up with John tomorrow"\n• Use `/leancrm` for CRM queries',
          },
        },
      ],
    });
  });

  // Handle app mentions in channels
  app.event('app_mention', async ({ event, say, context }) => {
    const teamId = context.teamId;
    if (!teamId) return;

    const tenantId = await installationStore.getTenantId(teamId);
    if (!tenantId) {
      await say('This workspace is not linked to an InviCRM account.');
      return;
    }

    // Remove the mention from the text
    const text = event.text.replace(/<@[A-Z0-9]+>/g, '').trim();

    if (!text) {
      await say('Hi! Use `/leancrm` followed by your question to interact with your CRM.');
      return;
    }

    await say(`For CRM queries, please use \`/leancrm ${text}\` instead.`);
  });
}
