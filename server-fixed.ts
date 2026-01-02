import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { initializeDatabase } from '../database/config-sqlite';
import { EngagementService } from '../services/engagementService';
import { authService } from '../services/auth.service';
import { dashboardService } from '../services/dashboard.service';

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
app.use(helmet());

app.use(cors());
app.use(compression());
app.use(express.json());

// Apply rate limiting to all routes
app.use(limiter);

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
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
            environment: process.env.NODE_ENV || 'development'
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
        
        // Mock response for now
        const engagementId = `eng_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        res.status(201).json({
            success: true,
            engagementId,
            userId,
            sessionId,
            createdAt: new Date().toISOString(),
            message: 'Engagement created (mock)'
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
        
        res.json({
            engagementId,
            exists: true,
            status: 'active',
            createdAt: new Date().toISOString(),
            message: 'Mock response'
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
        
        console.log(`Processing ${events.length} events for ${engagementId}`);
        
        res.json({
            success: true,
            engagementId,
            processedCount: events.length,
            message: 'Events processed (mock)'
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
        
        res.json({
            engagementId,
            totalEvents: 0,
            events: [],
            message: 'Mock response'
        });
        
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// === DASHBOARD ROUTES ===

// 6. Get dashboard statistics (protected)
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

// 7. Get time-series data for charts (protected)
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
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// Initialize and start server
async function startServer() {
    try {
        console.log('🚀 Starting SeekReap API with Dashboard...');
        console.log('📁 Environment:', process.env.NODE_ENV || 'development');
        
        // Initialize database
        await initializeDatabase();
        console.log('✅ Database connected');
        
        // Initialize services
        engagementService = new EngagementService();
        console.log('✅ Services initialized');
        
        // Start server
        const server = app.listen(PORT, () => {
            console.log(`✅ API running on http://localhost:${PORT}`);
            console.log(`📋 Health check: http://localhost:${PORT}/health`);
            console.log(`📊 Dashboard stats: http://localhost:${PORT}/dashboard/stats (requires API key)`);
            console.log(`🔑 Test API Key: dev_key_12345`);
        });
        
        // Graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n👋 Shutting down gracefully...');
            server.close(() => {
                console.log('✅ Server closed');
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
