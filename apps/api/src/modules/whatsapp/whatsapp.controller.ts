import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WhatsAppService } from './whatsapp.service';
import { SyncWhatsAppMessagesDto } from './dto/whatsapp-message.dto';

@ApiTags('whatsapp')
@Controller({ path: 'whatsapp', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WhatsAppController {
  constructor(private readonly whatsappService: WhatsAppService) {}

  @Post('messages')
  @ApiOperation({ summary: 'Sync WhatsApp messages from Chrome extension' })
  @ApiResponse({ status: 201, description: 'Messages synced successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async syncMessages(
    @Body() dto: SyncWhatsAppMessagesDto,
    @Request() req: any,
  ) {
    const result = await this.whatsappService.processMessages(
      dto.messages,
      req.user.tenantId,
      req.user.userId,
    );

    return {
      success: true,
      ...result,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get WhatsApp sync statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getStats(@Request() req: any) {
    return this.whatsappService.getSyncStats(req.user.tenantId);
  }
}
