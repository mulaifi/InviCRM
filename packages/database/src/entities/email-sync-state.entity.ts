import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('email_sync_states')
export class EmailSyncState extends BaseEntity {
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'history_id', length: 100, nullable: true })
  historyId: string;

  @Column({ name: 'last_sync_at', type: 'timestamp', nullable: true })
  lastSyncAt: Date;

  @Column({ name: 'initial_import_completed', default: false })
  initialImportCompleted: boolean;

  @Column({ name: 'messages_synced', type: 'int', default: 0 })
  messagesSynced: number;

  @Column({ name: 'sync_status', length: 20, default: 'pending' })
  syncStatus: string; // 'pending', 'syncing', 'completed', 'error'

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'error_count', type: 'int', default: 0 })
  errorCount: number;

  @Column({ name: 'last_error_at', type: 'timestamp', nullable: true })
  lastErrorAt: Date;
}
