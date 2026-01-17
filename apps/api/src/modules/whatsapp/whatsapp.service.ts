import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Contact, Activity } from '@invicrm/database';
import { WhatsAppMessageDto } from './dto/whatsapp-message.dto';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
  ) {}

  /**
   * Process incoming WhatsApp messages from the Chrome extension
   */
  async processMessages(
    messages: WhatsAppMessageDto[],
    tenantId: string,
    userId: string,
  ): Promise<{
    processed: number;
    matched: number;
    created: number;
  }> {
    let processed = 0;
    let matched = 0;
    let created = 0;

    // Group messages by chat/contact
    const messagesByChat = new Map<string, WhatsAppMessageDto[]>();
    for (const msg of messages) {
      const chatId = msg.phone || msg.chatId;
      const existing = messagesByChat.get(chatId);
      if (existing) {
        existing.push(msg);
      } else {
        messagesByChat.set(chatId, [msg]);
      }
    }

    // Process each chat
    for (const [chatId, chatMessages] of messagesByChat) {
      const firstMessage = chatMessages[0];
      let contact = await this.findContactByPhone(firstMessage.phone, tenantId);

      if (!contact && firstMessage.chatName) {
        // Try to find by name
        contact = await this.findContactByName(firstMessage.chatName, tenantId);
      }

      if (!contact && firstMessage.phone) {
        // Create new contact
        contact = await this.createContactFromWhatsApp(firstMessage, tenantId);
        created++;
      }

      if (contact) {
        matched++;
        // Create activities for messages
        for (const msg of chatMessages) {
          await this.createActivityFromMessage(msg, contact, tenantId, userId);
          processed++;
        }

        // Update last contacted
        await this.contactRepository.update(contact.id, {
          lastContactedAt: new Date(),
        });
      } else {
        this.logger.warn(`Could not match or create contact for chat: ${chatId}`);
        processed += chatMessages.length;
      }
    }

    return { processed, matched, created };
  }

  /**
   * Find contact by phone number with normalization
   */
  private async findContactByPhone(
    phone: string | undefined,
    tenantId: string,
  ): Promise<Contact | null> {
    if (!phone) return null;

    const normalized = this.normalizePhone(phone);
    if (!normalized) return null;

    // Try exact match first
    let contact = await this.contactRepository.findOne({
      where: { phone: normalized, tenantId },
    });

    if (contact) return contact;

    // Try partial match (last 9 digits)
    const lastDigits = normalized.slice(-9);
    contact = await this.contactRepository.findOne({
      where: { phone: Like(`%${lastDigits}`), tenantId },
    });

    return contact;
  }

  /**
   * Find contact by name (fuzzy match)
   */
  private async findContactByName(
    name: string,
    tenantId: string,
  ): Promise<Contact | null> {
    if (!name) return null;

    const nameParts = name.trim().split(/\s+/);
    if (nameParts.length === 0) return null;

    // Try exact name match
    if (nameParts.length >= 2) {
      const contact = await this.contactRepository.findOne({
        where: {
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(' '),
          tenantId,
        },
      });
      if (contact) return contact;
    }

    // Try partial match on first name
    const contacts = await this.contactRepository.find({
      where: { firstName: Like(`${nameParts[0]}%`), tenantId },
      take: 5,
    });

    // Return best match if only one result
    if (contacts.length === 1) return contacts[0];

    return null;
  }

  /**
   * Create a new contact from WhatsApp message
   */
  private async createContactFromWhatsApp(
    message: WhatsAppMessageDto,
    tenantId: string,
  ): Promise<Contact> {
    const nameParts = message.chatName.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Unknown';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    const phone = this.normalizePhone(message.phone);
    const contact = this.contactRepository.create({
      tenantId,
      firstName,
      lastName,
      phone: phone || undefined,
      source: 'whatsapp',
      confidenceScore: 0.7,
    });

    return this.contactRepository.save(contact) as Promise<Contact>;
  }

  /**
   * Create activity record from WhatsApp message
   */
  private async createActivityFromMessage(
    message: WhatsAppMessageDto,
    contact: Contact,
    tenantId: string,
    userId: string,
  ): Promise<Activity> {
    // Check for duplicate
    const existing = await this.activityRepository.findOne({
      where: {
        tenantId,
        contactId: contact.id,
        type: 'whatsapp',
        externalId: message.id,
      },
    });

    if (existing) return existing;

    const activity = this.activityRepository.create({
      tenantId,
      userId,
      contactId: contact.id,
      type: 'whatsapp',
      direction: message.direction === 'incoming' ? 'inbound' : 'outbound',
      subject: `WhatsApp: ${message.chatName}`,
      body: message.text,
      externalId: message.id,
      occurredAt: new Date(message.timestamp),
      source: 'whatsapp-extension',
      metadata: {
        phone: message.phone,
        chatId: message.chatId,
        capturedAt: message.capturedAt,
      },
    });

    return this.activityRepository.save(activity) as Promise<Activity>;
  }

  /**
   * Normalize phone number to consistent format
   */
  private normalizePhone(phone: string | undefined): string | null {
    if (!phone) return null;

    // Remove all non-digit characters except leading +
    let normalized = phone.replace(/[^\d+]/g, '');

    // Ensure it starts with + for international format
    if (!normalized.startsWith('+')) {
      // Assume Kuwait if 8 digits
      if (normalized.length === 8) {
        normalized = '+965' + normalized;
      }
      // Assume international if 10+ digits
      else if (normalized.length >= 10) {
        normalized = '+' + normalized;
      }
    }

    return normalized || null;
  }

  /**
   * Get WhatsApp sync statistics for a user
   */
  async getSyncStats(tenantId: string): Promise<{
    totalMessages: number;
    uniqueContacts: number;
    lastSyncAt: Date | null;
  }> {
    const totalMessages = await this.activityRepository.count({
      where: { tenantId, type: 'whatsapp' },
    });

    const uniqueContactsResult = await this.activityRepository
      .createQueryBuilder('activity')
      .select('COUNT(DISTINCT activity.contactId)', 'count')
      .where('activity.tenantId = :tenantId', { tenantId })
      .andWhere('activity.type = :type', { type: 'whatsapp' })
      .getRawOne();

    const lastActivity = await this.activityRepository.findOne({
      where: { tenantId, type: 'whatsapp' },
      order: { createdAt: 'DESC' },
    });

    return {
      totalMessages,
      uniqueContacts: parseInt(uniqueContactsResult?.count || '0', 10),
      lastSyncAt: lastActivity?.createdAt || null,
    };
  }
}
