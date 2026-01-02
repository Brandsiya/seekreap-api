import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Engagement } from '../entities/engagement.entity';
import { EngagementEvent } from '../entities/engagementEvent.entity';
import * as path from 'path';

// Use SQLite for development (simpler, file-based)
export const AppDataSource = new DataSource({
    type: 'better-sqlite3',
    database: path.join(__dirname, '../../database.sqlite'),
    
    // Entities
    entities: [Engagement, EngagementEvent],
    
    // Development settings
    synchronize: true,      // Auto-create/update tables
    logging: false,         // Set to true to see SQL queries
    dropSchema: false,     // WARNING: Set to true only for development reset
    
    // SQLite specific optimizations
    enableWAL: true,       // Write-Ahead Logging (better concurrency)
    verbose: console.log,  // Optional: Log SQLite operations
    
    // Connection pool (SQLite doesn't really need this but TypeORM expects it)
    extra: {
        connectionLimit: 1  // SQLite is single-connection
    }
});

// Initialize database connection
export async function initializeDatabase(): Promise<void> {
    try {
        console.log('🔄 Initializing SQLite database...');
        
        await AppDataSource.initialize();
        
        console.log('✅ SQLite database connected successfully!');
        console.log(`📁 Database file: ${AppDataSource.options.database}`);
        console.log('📊 Database is synchronized and ready for use');
        
        // Optional: Show table info
        const tables = await AppDataSource.query(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        );
        console.log(`📈 Tables created: ${tables.map((t: any) => t.name).join(', ') || 'None yet'}`);
        
    } catch (error) {
        console.error('❌ Failed to initialize database:', error);
        
        // Provide helpful error message
        if (error instanceof Error) {
            if (error.message.includes('SQLITE_CANTOPEN')) {
                console.error('💡 Tip: Check file permissions for database.sqlite');
            } else if (error.message.includes('SQLITE_ERROR')) {
                console.error('💡 Tip: There might be a schema error. Try deleting database.sqlite');
            }
        }
        
        throw error;
    }
}
