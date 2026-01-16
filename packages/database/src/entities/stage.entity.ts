import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Pipeline } from './pipeline.entity';
import { Deal } from './deal.entity';

@Entity('stages')
export class Stage extends BaseEntity {
  @Index()
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'pipeline_id', type: 'uuid' })
  pipelineId: string;

  @ManyToOne(() => Pipeline, (pipeline) => pipeline.stages)
  @JoinColumn({ name: 'pipeline_id' })
  pipeline: Pipeline;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'int' })
  position: number;

  @Column({ type: 'int', default: 0 })
  probability: number;

  @Column({ length: 20, default: 'open' })
  type: string; // 'open', 'won', 'lost'

  @Column({ length: 7, nullable: true })
  color: string;

  @OneToMany(() => Deal, (deal) => deal.stage)
  deals: Deal[];
}
