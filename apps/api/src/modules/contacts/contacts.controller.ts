import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('contacts')
@Controller({ path: 'contacts', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new contact' })
  create(
    @CurrentUser('tenantId') tenantId: string,
    @Body() createContactDto: CreateContactDto,
  ) {
    return this.contactsService.create(tenantId, createContactDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all contacts' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('companyId') companyId?: string,
  ) {
    return this.contactsService.findAll(tenantId, {
      page,
      limit,
      search,
      companyId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contact by ID' })
  findOne(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.contactsService.findById(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update contact' })
  update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateContactDto: UpdateContactDto,
  ) {
    return this.contactsService.update(tenantId, id, updateContactDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete contact' })
  remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.contactsService.softDelete(tenantId, id);
  }

  @Get('duplicates/detect')
  @ApiOperation({ summary: 'Detect potential duplicate contacts' })
  @ApiQuery({ name: 'useAI', required: false, type: Boolean })
  @ApiQuery({ name: 'minConfidence', required: false, type: Number })
  detectDuplicates(
    @CurrentUser('tenantId') tenantId: string,
    @Query('useAI') useAI?: boolean,
    @Query('minConfidence') minConfidence?: number,
  ) {
    return this.contactsService.detectDuplicates(tenantId, {
      useAI: useAI !== false,
      minConfidence: minConfidence || 0.5,
    });
  }

  @Post('merge')
  @ApiOperation({ summary: 'Merge two contacts (secondary into primary)' })
  merge(
    @CurrentUser('tenantId') tenantId: string,
    @Body() body: { primaryId: string; secondaryId: string },
  ) {
    return this.contactsService.mergeContacts(tenantId, body.primaryId, body.secondaryId);
  }
}
