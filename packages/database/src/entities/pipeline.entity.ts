import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Stage } from './stage.entity';
import { Deal } from './deal.entity';

@Entity('pipelines')
export class Pipeline extends BaseEntity {
  @Index()
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @OneToMany(() => Stage, (stage) => stage.pipeline)
  stages: Stage[];

  @OneToMany(() => Deal, (deal) => deal.pipeline)
  deals: Deal[];
}
