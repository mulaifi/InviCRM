import { App } from '@slack/bolt';
import { DataSource } from 'typeorm';
import { SlackInstallation, User } from '@invicrm/database';

export function registerEventHandlers(app: App, db: DataSource) {
  const installationRepo = db.getRepository(SlackInstallation);
  const userRepo = db.getRepository(User);

  // Handle app home opened
  app.event('app_home_opened', async ({ event, client }) => {
    try {
      const installation = await installationRepo.findOne({
        where: { isActive: true },
      });

      const isLinked = installation?.tenantId != null;

      await client.views.publish({
        user_id: event.user,
        view: {
          type: 'home',
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: 'Welcome to InviCRM',
                emoji: true,
              },
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: isLinked
                  ? 'Your workspace is connected to InviCRM. Use `/leancrm` to interact with your CRM.'
                  : 'This workspace is not yet linked to an InviCRM account. Please ask your admin to complete setup.',
              },
            },
            {
              type: 'divider',
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '*Quick Commands*',
              },
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '• `/leancrm What\'s happening with [name]?` - Get contact summary\n• `/leancrm Show my deals closing this month` - Pipeline overview\n• `/leancrm Who haven\'t I contacted in 2 weeks?` - Find stale relationships\n• `/leancrm Just had a call with [name] about [topic]` - Log activity',
              },
            },
            {
              type: 'divider',
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: 'InviCRM - The invisible CRM that works where you work',
                },
              ],
            },
          ],
        },
      });
    } catch (error) {
      console.error('Error publishing app home:', error);
    }
  });

  // Handle app uninstalled
  app.event('app_uninstalled', async ({ event, context }) => {
    try {
      const teamId = context.teamId;
      if (teamId) {
        await installationRepo.update({ teamId }, { isActive: false });
        console.log(`App uninstalled from team ${teamId}`);
      }
    } catch (error) {
      console.error('Error handling app uninstall:', error);
    }
  });

  // Handle tokens revoked
  app.event('tokens_revoked', async ({ event, context }) => {
    try {
      const teamId = context.teamId;
      if (teamId) {
        await installationRepo.update({ teamId }, { isActive: false });
        console.log(`Tokens revoked for team ${teamId}`);
      }
    } catch (error) {
      console.error('Error handling tokens revoked:', error);
    }
  });
}
