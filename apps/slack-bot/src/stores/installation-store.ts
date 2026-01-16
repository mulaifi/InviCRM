import { Installation, InstallationQuery } from '@slack/bolt';
import { DataSource, Repository } from 'typeorm';
import { SlackInstallation } from '@invicrm/database';

export class SlackInstallationStore {
  private repo: Repository<SlackInstallation>;

  constructor(private db: DataSource) {
    this.repo = db.getRepository(SlackInstallation);
  }

  async store(installation: Installation): Promise<void> {
    const teamId = installation.team?.id;
    if (!teamId) {
      throw new Error('Team ID is required for installation');
    }

    // Check if installation already exists
    let existing = await this.repo.findOne({
      where: { teamId },
    });

    if (existing) {
      // Update existing installation
      existing.teamName = installation.team?.name || existing.teamName;
      existing.botUserId = installation.bot?.userId || existing.botUserId;
      existing.botAccessToken = installation.bot?.token || existing.botAccessToken;
      existing.scopes = installation.bot?.scopes || existing.scopes;
      existing.isActive = true;
      await this.repo.save(existing);
    } else {
      // Create new installation
      // Note: tenantId will need to be set via a separate flow
      // where we link the Slack workspace to an InviCRM tenant
      const newInstallation = this.repo.create({
        teamId,
        teamName: installation.team?.name || 'Unknown',
        botUserId: installation.bot?.userId || '',
        botAccessToken: installation.bot?.token || '',
        installedAt: new Date(),
        isActive: true,
        scopes: installation.bot?.scopes || [],
      });
      await this.repo.save(newInstallation);
    }
  }

  async fetch(query: InstallationQuery<boolean>): Promise<Installation> {
    const teamId = query.teamId;
    if (!teamId) {
      throw new Error('Team ID is required to fetch installation');
    }

    const installation = await this.repo.findOne({
      where: { teamId, isActive: true },
    });

    if (!installation) {
      throw new Error(`Installation not found for team ${teamId}`);
    }

    // Return in Slack's expected format
    return {
      team: {
        id: installation.teamId,
        name: installation.teamName,
      },
      bot: {
        token: installation.botAccessToken,
        userId: installation.botUserId,
        scopes: installation.scopes || [],
        id: installation.botUserId,
      },
      tokenType: 'bot',
      isEnterpriseInstall: false,
    } as Installation;
  }

  async delete(query: InstallationQuery<boolean>): Promise<void> {
    const teamId = query.teamId;
    if (!teamId) {
      throw new Error('Team ID is required to delete installation');
    }

    await this.repo.update({ teamId }, { isActive: false });
  }

  // Link a Slack workspace to an InviCRM tenant
  async linkToTenant(teamId: string, tenantId: string, installedByUserId?: string): Promise<void> {
    await this.repo.update(
      { teamId },
      { tenantId, installedByUserId },
    );
  }

  // Get tenant ID for a Slack team
  async getTenantId(teamId: string): Promise<string | null> {
    const installation = await this.repo.findOne({
      where: { teamId, isActive: true },
    });
    return installation?.tenantId || null;
  }

  // Get installation by tenant ID
  async getByTenantId(tenantId: string): Promise<SlackInstallation | null> {
    return this.repo.findOne({
      where: { tenantId, isActive: true },
    });
  }
}
