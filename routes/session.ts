// routes/session.ts (updated version)
import { Router } from 'express';
import { sessionService } from '../services/session-redis.service';
import { requireSession } from '../middleware/session.middleware';

const router = Router();

/**
 * @route POST /session/start
 * @description Start a new anonymous session
 * @access Public
 */
router.post('/start', async (req, res) => {
    try {
        const { sessionId, expiresAt } = await sessionService.createSession(
            req.ip,
            req.headers['user-agent'],
            req.headers['x-device-fingerprint'] as string
        );
        
        // Set secure cookie
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('sessionId', sessionId, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax',
            maxAge: 30 * 60 * 1000,
            path: '/',
        });
        
        res.json({
            success: true,
            sessionId,
            expiresAt,
            expiresIn: '30 minutes',
            message: 'Use X-Session-Id header for subsequent requests'
        });
    } catch (error: any) {
        console.error('Session creation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create session',
            message: error.message
        });
    }
});

/**
 * @route GET /session/validate
 * @description Validate current session
 * @access Public (but requires session header)
 */
router.get('/validate', async (req, res) => {
    try {
        const sessionId = req.headers['x-session-id'] as string || 
                         req.cookies?.sessionId;
        
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: 'Session ID required',
                message: 'Provide X-Session-Id header or sessionId cookie'
            });
        }
        
        const session = await sessionService.getSession(sessionId);
        
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found',
                message: 'Session may have expired'
            });
        }
        
        res.json({
            success: true,
            session: {
                id: session.id,
                createdAt: session.createdAt,
                expiresAt: session.expiresAt,
                verificationCompleted: session.verificationCompleted,
                hasEngagement: !!session.engagementId
            }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: 'Session validation failed',
            message: error.message
        });
    }
});

/**
 * @route POST /session/end
 * @description End current session
 * @access Protected (requires session)
 */
router.post('/end', requireSession, async (req, res) => {
    try {
        const deleted = await sessionService.deleteSession(req.sessionId!);
        
        // Clear cookie
        res.clearCookie('sessionId');
        
        res.json({
            success: deleted,
            message: deleted ? 'Session ended successfully' : 'Session not found'
        });
    } catch (error: any) {
        console.error('Session deletion error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to end session',
            message: error.message
        });
    }
});

/**
 * @route POST /session/verification/start
 * @description Generate verification token for session
 * @access Protected (requires session)
 */
router.post('/verification/start', requireSession, async (req, res) => {
    try {
        const token = await sessionService.createVerificationToken(req.sessionId!);
        
        res.json({
            success: true,
            verificationToken: token,
            expiresIn: '5 minutes',
            message: 'Use this token for verification endpoints'
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: 'Verification token creation failed',
            message: error.message
        });
    }
});

// Keep your existing endpoints with updated paths
router.post('/verify-token', requireSession, async (req, res) => {
    try {
        const { token } = req.body;
        const sessionId = req.sessionId!;
        
        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Token required'
            });
        }
        
        const result = await sessionService.validateAndCompleteVerification(token, sessionId);
        
        if (!result.valid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid verification token'
            });
        }
        
        res.json({
            success: true,
            sessionId,
            verifiedAt: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Verification failed',
            message: error.message
        });
    }
});

router.post('/complete-verification', requireSession, async (req, res) => {
    try {
        // This endpoint might be redundant now
        // Since validateAndCompleteVerification already completes verification
        
        res.json({
            success: true,
            message: 'Verification flow updated - use /verify-token endpoint',
            sessionId: req.sessionId
        });
    } catch (error: any) {
        console.error('Complete verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Complete verification failed',
            message: error.message
        });
    }
});

export default router;
