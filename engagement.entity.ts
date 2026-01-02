import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { EngagementEvent } from './engagementEvent.entity';

@Entity('engagements')
export class Engagement {
    @PrimaryColumn()
    id!: string;

    @Column()
    userId!: string;

    @Column({ nullable: true })
    sessionId?: string;

    @Column({ type: 'simple-json', nullable: true })  // Changed from jsonb to simple-json
    metadata?: Record<string, any>;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @OneToMany(() => EngagementEvent, event => event.engagement)
    events!: EngagementEvent[];
}
