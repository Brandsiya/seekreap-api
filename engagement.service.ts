import { AppDataSource } from '../database/config';
import { Engagement } from '../entities/engagement.entity';
import { EngagementEvent } from '../entities/engagementEvent.entity';

export class EngagementService {
    private engagementRepository = AppDataSource.getRepository(Engagement);
    private eventRepository = AppDataSource.getRepository(EngagementEvent);

    async appendEvents(engagementId: string, events: any[]) {
        // Check if engagement exists
        let engagement = await this.engagementRepository.findOne({
            where: { id: engagementId }
        });

        // Create engagement if it doesn't exist
        if (!engagement) {
            engagement = this.engagementRepository.create({
                id: engagementId,
                userId: events[0]?.userId || 'unknown'
            });
            await this.engagementRepository.save(engagement);
        }

        // Create and save events
        const eventEntities = events.map((event: any) => {
            return this.eventRepository.create({
                engagementId,
                type: event.type,
                occurredAt: new Date(event.occurredAt),
                deviceFingerprint: event.deviceFingerprint,
                questionId: event.questionId,
                answer: event.answer,
                details: event.details
            });
        });

        const savedEvents = await this.eventRepository.save(eventEntities);

        return {
            engagementId,
            count: savedEvents.length,
            events: savedEvents.map(event => ({
                id: event.id,
                type: event.type,
                occurredAt: event.occurredAt
            }))
        };
    }

    async getEvents(engagementId: string) {
        return this.eventRepository.find({
            where: { engagementId },
            order: { occurredAt: 'ASC' }
        });
    }

    async engagementExists(engagementId: string) {
        const count = await this.engagementRepository.count({
            where: { id: engagementId }
        });
        return count > 0;
    }

    async getEngagement(engagementId: string) {
        return this.engagementRepository.findOne({
            where: { id: engagementId },
            relations: ['events']
        });
    }
}