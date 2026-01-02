import { AppDataSource } from '../database/config-sqlite';
import { Engagement } from '../entities/engagement.entity';
import { EngagementEvent } from '../entities/engagementEvent.entity';

export class DashboardService {
    private engagementRepository = AppDataSource.getRepository(Engagement);
    private eventRepository = AppDataSource.getRepository(EngagementEvent);

    async getOverallStats() {
        try {
            const [engagementCount, eventCount] = await Promise.all([
                this.engagementRepository.count(),
                this.eventRepository.count()
            ]);

            return {
                summary: {
                    totalEngagements: engagementCount,
                    totalEvents: eventCount,
                    avgEventsPerEngagement: engagementCount > 0 ? (eventCount / engagementCount).toFixed(2) : 0
                },
                riskAnalysis: {
                    highRiskCount: 0,
                    mediumRiskCount: 0,
                    lowRiskCount: 0
                }
            };
        } catch (error) {
            console.error('Error in getOverallStats:', error);
            return {
                summary: { totalEngagements: 0, totalEvents: 0, avgEventsPerEngagement: 0 },
                riskAnalysis: { highRiskCount: 0, mediumRiskCount: 0, lowRiskCount: 0 }
            };
        }
    }

    async getTimeSeriesData(days: number = 7) {
        return {
            engagementsOverTime: [],
            eventsOverTime: []
        };
    }
}

export const dashboardService = new DashboardService();
