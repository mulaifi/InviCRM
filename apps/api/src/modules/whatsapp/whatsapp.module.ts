import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact, Activity } from '@invicrm/database';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';

@Module({
  imports: [TypeOrmModule.forFeature([Contact, Activity])],
  controllers: [WhatsAppController],
  providers: [WhatsAppService],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
