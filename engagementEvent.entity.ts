import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from 'typeorm';
import { Engagement } from './engagement.entity';

@Entity('engagement_events')
@Index(['engagementId', 'occurredAt'])
export class EngagementEvent {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    engagementId!: string;

    @Column()
    type!: string;

    @Column()
    occurredAt!: Date;

    @Column({ nullable: true })
    deviceFingerprint?: string;

    @Column({ nullable: true })
    questionId?: string;

    @Column({ type: 'text', nullable: true })
    answer?: string;

    @Column({ type: 'simple-json', nullable: true })  // Changed from jsonb to simple-json
    details?: Record<string, any>;

    @CreateDateColumn()
    recordedAt!: Date;

    @ManyToOne(() => Engagement, engagement => engagement.events, { onDelete: 'CASCADE' })
    engagement!: Engagement;
}
