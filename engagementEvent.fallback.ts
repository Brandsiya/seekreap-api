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

    @Column({ type: 'text', nullable: true })  // Use text and handle JSON manually
    details?: string;  // Store as JSON string

    @CreateDateColumn()
    recordedAt!: Date;

    @ManyToOne(() => Engagement, engagement => engagement.events, { onDelete: 'CASCADE' })
    engagement!: Engagement;

    // Helper method to get details as object
    getDetailsObject(): Record<string, any> | null {
        try {
            return this.details ? JSON.parse(this.details) : null;
        } catch {
            return null;
        }
    }

    // Helper method to set details from object
    setDetailsObject(obj: Record<string, any> | null): void {
        this.details = obj ? JSON.stringify(obj) : null;
    }
}
