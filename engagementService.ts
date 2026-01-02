import { AppDataSource } from '../database/config-sqlite';
import { Engagement } from '../entities/engagement.entity';
import { EngagementEvent } from '../entities/engagementEvent.entity';

export class EngagementService {
    private engagementRepository = AppDataSource.getRepository(Engagement);
    private eventRepository = AppDataSource.getRepository(EngagementEvent);

    constructor() {
        console.log('EngagementService initialized with database repositories');
    }

    // Create a new engagement
    async createEngagement(userId: string, sessionId?: string, metadata?: any) {
        const engagement = this.engagementRepository.create({
            id: `eng_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            sessionId,
            metadata
        });

        return await this.engagementRepository.save(engagement);
    }

    // Get engagement by ID
    async getEngagement(engagementId: string) {
        return await this.engagementRepository.findOne({
            where: { id: engagementId },
            relations: ['events']
        });
    }

    // Check if engagement exists
    async engagementExists(engagementId: string) {
        const count = await this.engagementRepository.count({
            where: { id: engagementId }
        });
        return count > 0;
    }

    // Add events to engagement
    async addEvents(engagementId: string, events: any[]) {
        // Check if engagement exists
        const engagement = await this.getEngagement(engagementId);
        if (!engagement) {
            throw new Error(`Engagement ${engagementId} not found`);
        }

        // Create event entities
        const eventEntities = events.map(eventData => {
            return this.eventRepository.create({
                engagementId,
                type: eventData.type,
                occurredAt: new Date(eventData.occurredAt || Date.now()),
                deviceFingerprint: eventData.deviceFingerprint,
                questionId: eventData.questionId,
                answer: eventData.answer,
                details: eventData.details
            });
        });

        // Save all events
        const savedEvents = await this.eventRepository.save(eventEntities);
        
        return {
            engagementId,
            count: savedEvents.length,
            events: savedEvents
        };
    }

    // Get events for an engagement
    async getEvents(engagementId: string, limit?: number) {
        const query = this.eventRepository
            .createQueryBuilder('event')
            .where('event.engagementId = :engagementId', { engagementId })
            .orderBy('event.occurredAt', 'ASC');

        if (limit) {
            query.limit(limit);
        }

        return await query.getMany();
    }

    // Get event statistics
    async getEventStats(engagementId: string) {
        const events = await this.getEvents(engagementId);
        
        const stats = {
            total: events.length,
            byType: {} as Record<string, number>,
            firstEvent: events[0]?.occurredAt || null,
            lastEvent: events[events.length - 1]?.occurredAt || null
        };

        events.forEach(event => {
            stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;
        });

        return stats;
    }
}
