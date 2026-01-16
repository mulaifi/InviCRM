import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DealsService } from './deals.service';
import { DealsController } from './deals.controller';
import { Deal, Pipeline, Stage } from '@invicrm/database';

@Module({
  imports: [TypeOrmModule.forFeature([Deal, Pipeline, Stage])],
  controllers: [DealsController],
  providers: [DealsService],
  exports: [DealsService],
})
export class DealsModule {}
