import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PipelinesService } from './pipelines.service';
import { PipelinesController, StagesController, PipelineStagesController } from './pipelines.controller';
import { Pipeline, Stage } from '@invicrm/database';

@Module({
  imports: [TypeOrmModule.forFeature([Pipeline, Stage])],
  controllers: [PipelinesController, StagesController, PipelineStagesController],
  providers: [PipelinesService],
  exports: [PipelinesService],
})
export class PipelinesModule {}
