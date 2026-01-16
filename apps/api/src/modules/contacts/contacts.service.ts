import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Contact, Company } from '@invicrm/database';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

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
}
