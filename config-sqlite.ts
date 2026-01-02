import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Engagement } from '../entities/engagement.entity';
import { EngagementEvent } from '../entities/engagementEvent.entity';
import * as path from 'path';

// SQLite configuration
export const AppDataSource = new DataSource({
    type: 'better-sqlite3',
    database: path.join(__dirname, '../../database.sqlite'),
    
    // Entities
    entities: [Engagement, EngagementEvent],
    
    // Development settings
    synchronize: true,
    logging: false,
    
    // SQLite settings
    enableWAL: true,
});

// Initialize database connection
export async function initializeDatabase(): Promise<void> {
    try {
        console.log('🔄 Connecting to SQLite database...');
        
        await AppDataSource.initialize();
        
        console.log('✅ SQLite database connected successfully!');
        console.log(`📁 Database file: ${AppDataSource.options.database}`);
        
    } catch (error) {
        console.error('❌ Failed to connect to database:', error);
        throw error;
    }
}
