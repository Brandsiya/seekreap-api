import express from 'express';
import cookieParser from 'cookie-parser';
import sessionRoutes from './routes/session';
import verificationRoutes from './routes/verification';
import { createSessionIfMissing } from './middleware/auth';
import { cleanupExpiredSessions } from './services/session';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(createSessionIfMissing); // Auto-create sessions if missing

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/session', sessionRoutes);
app.use('/api/verification', verificationRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'SeekReap Phase 1 API'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`
    });
});

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`SeekReap Phase 1 API running on port ${PORT}`);
    
    // Clean up expired sessions every hour
    setInterval(() => {
        const cleaned = cleanupExpiredSessions();
        if (cleaned > 0) {
            console.log(`Cleaned up ${cleaned} expired sessions`);
        }
    }, 60 * 60 * 1000);
});

export default app;
