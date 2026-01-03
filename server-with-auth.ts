// server-with-auth.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { Request, Response, NextFunction } from 'express';
import { initializeDatabase } from '../database/config-sqlite';
import { EngagementService } from '../services/engagementService';
import rateLimit from 'express-rate-limit';

// NEW: Import session-based authentication
import { 
    createSessionIfMissing, 
    requireSession,
    sessionHealth 
} from './middleware/session.middleware';
import sessionRoutes from './routes/session.routes';
import verificationRoutes from './routes/verification.routes';

const app = express();
const PORT = process.env.PORT || 3001;
let engagementService: EngagementService;

// Load environment variables
require('dotenv').config();

// === SECURITY MIDDLEWARE ===

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    keyGenerator: (req) => {
        // Use session ID for rate limiting if available, otherwise IP
        return req.sessionId || req.ip || 'unknown';
    },
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
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    exposedHeaders: ['X-Session-Id', 'X-Session-Created']
}));

app.use(compression());
app.use(express.json());

// NEW: Session creation middleware (runs on all requests)
app.use(createSessionIfMissing);

// Apply rate limiting
app.use(limiter);

// Request logging with IP and session
app.use((req: Request, res: Response, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const sessionId = req.sessionId ? req.sessionId.substring(0, 8) + '...' : 'no-session';
    console.log(`${new Date().toISOString()} ${ip} [${sessionId}] ${req.method} ${req.url}`);
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

// NEW: Session health check
app.get('/session/health', sessionHealth);

// === SESSION MANAGEMENT ROUTES (Public) ===
app.use('/session', sessionRoutes);

// === VERIFICATION ROUTES (Session + Token protected) ===
app.use('/verification', verificationRoutes);

// === PROTECTED ROUTES (Require valid session) ===

// Apply session validation to all engagement routes
app.use('/engagements', requireSession);

// 2. Create new engagement (protected by session)
app.post('/engagements', async (req: Request, res: Response) => {
    try {
        // Use sessionId as userId for Phase 1 anonymous sessions
        const userId = req.sessionId; // Changed from req.body.userId
        const { sessionId: clientSessionId, metadata } = req.body;
        
        if (!userId) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Valid session required'
            });
        }
        
        const engagement = await engagementService.createEngagement(userId, clientSessionId, metadata);
        
        res.status(201).json({
            success: true,
            engagementId: engagement.id,
            sessionId: engagement.userId, // This is now the anonymous session ID
            clientSessionId: engagement.sessionId,
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

// 3. Get engagement by ID (protected by session)
app.get('/engagements/:engagementId', async (req: Request, res: Response) => {
    try {
        const { engagementId } = req.params;
        const sessionId = req.sessionId; // Get from session middleware
        
        const engagement = await engagementService.getEngagement(engagementId);
        
        if (!engagement) {
            return res.status(404).json({
                error: 'Not found',
                message: `Engagement ${engagementId} not found`
            });
        }
        
        // Optional: Verify engagement belongs to this session
        if (engagement.userId !== sessionId) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have access to this engagement'
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

// 4. Add events to engagement (protected by session)
app.post('/engagements/:engagementId/events', async (req: Request, res: Response) => {
    try {
        const { engagementId } = req.params;
        const sessionId = req.sessionId;
        const events = req.body;
        
        if (!Array.isArray(events)) {
            return res.status(400).json({
                error: 'Validation failed',
                message: 'Request body must be an array of events'
            });
        }
        
        // Verify engagement belongs to this session
        const engagement = await engagementService.getEngagement(engagementId);
        if (!engagement || engagement.userId !== sessionId) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have access to this engagement'
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

// 5. Get engagement events (protected by session)
app.get('/engagements/:engagementId/events', async (req: Request, res: Response) => {
    try {
        const { engagementId } = req.params;
        const sessionId = req.sessionId;
        
        // Verify engagement belongs to this session
        const engagement = await engagementService.getEngagement(engagementId);
        if (!engagement || engagement.userId !== sessionId) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have access to this engagement'
            });
        }
        
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

// 6. Get engagement statistics (protected by session)
app.get('/engagements/:engagementId/stats', async (req: Request, res: Response) => {
    try {
        const { engagementId } = req.params;
        const sessionId = req.sessionId;
        
        // Verify engagement belongs to this session
        const engagement = await engagementService.getEngagement(engagementId);
        if (!engagement || engagement.userId !== sessionId) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have access to this engagement'
            });
        }
        
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

// === ADMIN ROUTES (Keep API key for admin) ===
// You might want to keep the old authService for admin routes only
import { authService } from '../services/auth.service';

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

// 7. Generate new API key (admin only - optional for Phase 1)
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
        console.log('🔐 Starting Secure SeekReap API (Phase 1 Authentication)...');
        console.log('📁 Environment:', process.env.NODE_ENV || 'development');
        console.log('👤 Authentication: ANONYMOUS SESSIONS (Redis)');
        console.log('🚫 Rate Limiting: ENABLED (per session)');
        console.log('🔑 Admin API Keys: ENABLED (for admin routes only)');
        
        // Check Redis configuration
        if (!process.env.REDIS_URL) {
            console.warn('⚠️  REDIS_URL not set. Sessions will not persist across restarts.');
            console.warn('   For production, set REDIS_URL to a Redis instance.');
        } else {
            console.log('🗄️  Redis: CONFIGURED');
        }
        
        // Initialize database
        await initializeDatabase();
        
        // Initialize services
        engagementService = new EngagementService();
        console.log('✅ Services initialized');
        
        // Start server
        const server = app.listen(PORT, () => {
            console.log(`✅ Secure API running on http://localhost:${PORT}`);
            console.log(`📋 Health check: http://localhost:${PORT}/health`);
            console.log(`👤 Session endpoint: POST http://localhost:${PORT}/session/start`);
            console.log(`📈 Rate limit: ${process.env.RATE_LIMIT_MAX_REQUESTS || 100} requests per 15 minutes per session`);
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

export default app;
