import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In } from 'typeorm';
import { Contact, Company } from '@invicrm/database';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import {
  AIClient,
  DuplicateDetector,
  ContactForDuplication,
  DuplicateAnalysisResult,
} from '@invicrm/ai-client';

@Injectable()
export class ContactsService {
  private duplicateDetector: DuplicateDetector | null = null;

  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {
    // Initialize AI-based duplicate detector if API key available
    if (process.env.ANTHROPIC_API_KEY) {
      const aiClient = new AIClient({ apiKey: process.env.ANTHROPIC_API_KEY });
      this.duplicateDetector = new DuplicateDetector(aiClient);
    }
  }

  async create(tenantId: string, createContactDto: CreateContactDto): Promise<Contact> {
    // Auto-create company from email domain if not provided
    let companyId = createContactDto.companyId;
    if (!companyId && createContactDto.email) {
      const domain = createContactDto.email.split('@')[1];
      if (domain) {
        const company = await this.findOrCreateCompanyByDomain(tenantId, domain);
        companyId = company.id;
      }
    }

    const contact = this.contactRepository.create({
      ...createContactDto,
      tenantId,
      companyId,
      source: createContactDto.source || 'manual',
      confidenceScore: createContactDto.confidenceScore || 1.0,
    });

    return this.contactRepository.save(contact);
  }

  async findAll(
    tenantId: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      companyId?: string;
    } = {},
  ): Promise<{ data: Contact[]; total: number; page: number; limit: number }> {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const skip = (page - 1) * limit;

    const queryBuilder = this.contactRepository
      .createQueryBuilder('contact')
      .leftJoinAndSelect('contact.company', 'company')
      .where('contact.tenantId = :tenantId', { tenantId })
      .andWhere('contact.isDeleted = :isDeleted', { isDeleted: false });

    if (options.search) {
      queryBuilder.andWhere(
        '(contact.firstName ILIKE :search OR contact.lastName ILIKE :search OR contact.email ILIKE :search)',
        { search: `%${options.search}%` },
      );
    }

    if (options.companyId) {
      queryBuilder.andWhere('contact.companyId = :companyId', {
        companyId: options.companyId,
      });
    }

    const [data, total] = await queryBuilder
      .orderBy('contact.updatedAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findById(tenantId: string, id: string): Promise<Contact> {
    const contact = await this.contactRepository.findOne({
      where: { id, tenantId, isDeleted: false },
      relations: ['company', 'activities'],
    });

    if (!contact) {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }

    return contact;
  }

  async findByEmail(tenantId: string, email: string): Promise<Contact | null> {
    return this.contactRepository.findOne({
      where: { email, tenantId, isDeleted: false },
    });
  }

  async update(
    tenantId: string,
    id: string,
    updateContactDto: UpdateContactDto,
  ): Promise<Contact> {
    const contact = await this.findById(tenantId, id);
    Object.assign(contact, updateContactDto);
    return this.contactRepository.save(contact);
  }

  async softDelete(tenantId: string, id: string): Promise<void> {
    const contact = await this.findById(tenantId, id);
    contact.isDeleted = true;
    contact.deletedAt = new Date();
    await this.contactRepository.save(contact);
  }

  async findOrCreateFromEmail(
    tenantId: string,
    email: string,
    extractedData?: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      title?: string;
      companyName?: string;
    },
  ): Promise<Contact> {
    let contact = await this.findByEmail(tenantId, email);

    if (!contact) {
      contact = await this.create(tenantId, {
        email,
        firstName: extractedData?.firstName || email.split('@')[0],
        lastName: extractedData?.lastName,
        phone: extractedData?.phone,
        title: extractedData?.title,
        source: 'email_sync',
        confidenceScore: extractedData?.firstName ? 0.8 : 0.5,
      });
    }

    return contact;
  }

  private async findOrCreateCompanyByDomain(
    tenantId: string,
    domain: string,
  ): Promise<Company> {
    // Skip common email providers
    const genericDomains = [
      'gmail.com',
      'yahoo.com',
      'hotmail.com',
      'outlook.com',
      'icloud.com',
    ];
    if (genericDomains.includes(domain.toLowerCase())) {
      return null as any;
    }

    let company = await this.companyRepository.findOne({
      where: { domain, tenantId, isDeleted: false },
    });

    if (!company) {
      company = this.companyRepository.create({
        tenantId,
        name: this.domainToCompanyName(domain),
        domain,
        source: 'auto_inferred',
      });
      company = await this.companyRepository.save(company);
    }

    return company;
  }

  private domainToCompanyName(domain: string): string {
    const name = domain.split('.')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  async detectDuplicates(
    tenantId: string,
    options: { useAI?: boolean; minConfidence?: number } = {},
  ): Promise<DuplicateAnalysisResult> {
    // Get all contacts for this tenant
    const contacts = await this.contactRepository.find({
      where: { tenantId, isDeleted: false },
      relations: ['company'],
    });

    // Convert to the format needed by DuplicateDetector
    const contactsForAnalysis: ContactForDuplication[] = contacts.map((c) => ({
      id: c.id,
      email: c.email || undefined,
      phone: c.phone || undefined,
      firstName: c.firstName,
      lastName: c.lastName || undefined,
      company: c.company?.name || undefined,
    }));

    // If no AI client, just use exact matching
    if (!this.duplicateDetector) {
      const detector = new DuplicateDetector(null as any);
      const exactDuplicates = detector.detectExactDuplicates(contactsForAnalysis);
      const fuzzyDuplicates = detector.detectFuzzyNameDuplicates(contactsForAnalysis);
      return {
        duplicates: [...exactDuplicates, ...fuzzyDuplicates],
        totalAnalyzed: contacts.length,
      };
    }

    return this.duplicateDetector.analyzeForDuplicates(contactsForAnalysis, options);
  }

  async mergeContacts(
    tenantId: string,
    primaryId: string,
    secondaryId: string,
  ): Promise<Contact> {
    const primary = await this.findById(tenantId, primaryId);
    const secondary = await this.findById(tenantId, secondaryId);

    // Merge data from secondary into primary (primary takes precedence)
    if (!primary.phone && secondary.phone) primary.phone = secondary.phone;
    if (!primary.title && secondary.title) primary.title = secondary.title;
    if (!primary.linkedin && secondary.linkedin) primary.linkedin = secondary.linkedin;
    if (!primary.companyId && secondary.companyId) primary.companyId = secondary.companyId;

    // Merge custom fields
    primary.customFields = {
      ...secondary.customFields,
      ...primary.customFields,
      mergedFrom: secondary.id,
      mergedAt: new Date().toISOString(),
    };

    // Update confidence score (merged contacts are more reliable)
    primary.confidenceScore = Math.min(1.0, primary.confidenceScore + 0.15);

    // Update activities to point to primary contact
    await this.contactRepository.manager.query(
      `UPDATE activities SET contact_id = $1 WHERE contact_id = $2 AND tenant_id = $3`,
      [primaryId, secondaryId, tenantId],
    );

    // Update deals to point to primary contact
    await this.contactRepository.manager.query(
      `UPDATE deals SET contact_id = $1 WHERE contact_id = $2 AND tenant_id = $3`,
      [primaryId, secondaryId, tenantId],
    );

    // Soft delete the secondary contact
    secondary.isDeleted = true;
    secondary.deletedAt = new Date();
    secondary.customFields = {
      ...secondary.customFields,
      mergedInto: primaryId,
      mergedAt: new Date().toISOString(),
    };
    await this.contactRepository.save(secondary);

    // Save the primary contact with merged data
    return this.contactRepository.save(primary);
  }
}
