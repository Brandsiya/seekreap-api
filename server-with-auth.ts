import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { Request, Response } from 'express';
import { initializeDatabase } from '../database/config-sqlite';
import { EngagementService } from '../services/engagementService';
import { authService } from '../services/auth.service';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 3001;
let engagementService: EngagementService;

// Load environment variables
require('dotenv').config();

// === SECURITY MIDDLEWARE ===

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: {
        error: 'Too many requests',
        message: 'Please try again later'
    }
});

// Security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(compression());
app.use(express.json());

// Apply rate limiting to all routes
app.use(limiter);

// Request logging with IP
app.use((req: Request, res: Response, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    console.log(`${new Date().toISOString()} ${ip} ${req.method} ${req.url}`);
    next();
});

// === PUBLIC ROUTES (No auth required) ===

// 1. Health check (public)
app.get('/health', async (req: Request, res: Response) => {
    try {
        const dbStatus = engagementService ? 'connected' : 'disconnected';
        
        res.json({
            status: 'healthy',
            service: 'SeekReap Verification API',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            database: dbStatus,
            environment: process.env.NODE_ENV || 'development',
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: 'Health check failed'
        });
    }
});

// === PROTECTED ROUTES (Require API key) ===

// Apply authentication to all following routes
app.use(authService.validateApiKey);

// 2. Create new engagement (protected)
app.post('/engagements', async (req: Request, res: Response) => {
    try {
        const { userId, sessionId, metadata } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                error: 'Validation failed',
                message: 'userId is required'
            });
        }
        
        const engagement = await engagementService.createEngagement(userId, sessionId, metadata);
        
        res.status(201).json({
            success: true,
            engagementId: engagement.id,
            userId: engagement.userId,
            sessionId: engagement.sessionId,
            createdAt: engagement.createdAt,
            message: 'Engagement created successfully'
        });
        
    } catch (error) {
        console.error('Error creating engagement:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// 3. Get engagement by ID (protected)
app.get('/engagements/:engagementId', async (req: Request, res: Response) => {
    try {
        const { engagementId } = req.params;
        const engagement = await engagementService.getEngagement(engagementId);
        
        if (!engagement) {
            return res.status(404).json({
                error: 'Not found',
                message: `Engagement ${engagementId} not found`
            });
        }
        
        res.json({
            success: true,
            engagement: {
                id: engagement.id,
                userId: engagement.userId,
                sessionId: engagement.sessionId,
                createdAt: engagement.createdAt,
                updatedAt: engagement.updatedAt,
                eventCount: engagement.events?.length || 0
            }
        });
        
    } catch (error) {
        console.error('Error fetching engagement:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// 4. Add events to engagement (protected)
app.post('/engagements/:engagementId/events', async (req: Request, res: Response) => {
    try {
        const { engagementId } = req.params;
        const events = req.body;
        
        if (!Array.isArray(events)) {
            return res.status(400).json({
                error: 'Validation failed',
                message: 'Request body must be an array of events'
            });
        }
        
        const result = await engagementService.addEvents(engagementId, events);
        
        res.json({
            success: true,
            engagementId: result.engagementId,
            processedCount: result.count,
            events: result.events.map((e: any) => ({
                id: e.id,
                type: e.type,
                occurredAt: e.occurredAt
            }))
        });
        
    } catch (error) {
        console.error('Error processing events:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// 5. Get engagement events (protected)
app.get('/engagements/:engagementId/events', async (req: Request, res: Response) => {
    try {
        const { engagementId } = req.params;
        const events = await engagementService.getEvents(engagementId);
        
        res.json({
            success: true,
            engagementId,
            totalEvents: events.length,
            events: events.map((e: any) => ({
                id: e.id,
                type: e.type,
                occurredAt: e.occurredAt,
                questionId: e.questionId,
                answer: e.answer
            }))
        });
        
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// 6. Get engagement statistics (protected)
app.get('/engagements/:engagementId/stats', async (req: Request, res: Response) => {
    try {
        const { engagementId } = req.params;
        const stats = await engagementService.getEventStats(engagementId);
        
        res.json({
            success: true,
            engagementId,
            stats
        });
        
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// === ADMIN ROUTES (Require admin API key) ===

const adminAuth = (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.ADMIN_API_KEY) {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Admin privileges required'
        });
    }
    next();
};

// 7. Generate new API key (admin only)
app.post('/admin/generate-key', adminAuth, (req: Request, res: Response) => {
    const { prefix } = req.body;
    const newKey = authService.generateApiKey(prefix);
    
    res.json({
        success: true,
        apiKey: newKey,
        message: 'Store this key securely. It will not be shown again.',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'Not Found',
        path: req.path,
        method: req.method,
        message: 'The requested endpoint does not exist'
    });
});

// Error handler
app.use((error: Error, req: Request, res: Response) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// Initialize and start server
async function startServer() {
    try {
        console.log('🔐 Starting Secure SeekReap API...');
        console.log('📁 Environment:', process.env.NODE_ENV || 'development');
        console.log('🔑 API Key Authentication: ENABLED');
        console.log('🚫 Rate Limiting: ENABLED');
        
        // Initialize database
        await initializeDatabase();
        
        // Initialize services
        engagementService = new EngagementService();
        console.log('✅ Services initialized');
        
        // Start server
        const server = app.listen(PORT, () => {
            console.log(`✅ Secure API running on http://localhost:${PORT}`);
            console.log(`📋 Health check: http://localhost:${PORT}/health`);
            console.log(`🔑 Test API Key: dev_key_12345`);
            console.log(`📈 Rate limit: ${process.env.RATE_LIMIT_MAX_REQUESTS || 100} requests per 15 minutes`);
        });
        
        // Graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n👋 Received SIGINT. Shutting down gracefully...');
            server.close(() => {
                console.log('✅ HTTP server closed');
                process.exit(0);
            });
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();

// === DASHBOARD ROUTES ===

// 8. Get dashboard statistics (protected)
app.get('/dashboard/stats', async (req: Request, res: Response) => {
    try {
        const stats = await dashboardService.getOverallStats();
        res.json({
            success: true,
            ...stats
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// 9. Get time-series data for charts (protected)
app.get('/dashboard/timeseries', async (req: Request, res: Response) => {
    try {
        const days = parseInt(req.query.days as string) || 7;
        const data = await dashboardService.getTimeSeriesData(days);
        res.json({
            success: true,
            ...data
        });
    } catch (error) {
        console.error('Error fetching time series data:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
