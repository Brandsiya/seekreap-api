import { Router } from 'express';
import { createAnonymousSession, validateSession, createVerificationToken } from '../services/session';

const router = Router();

/**
 * Start a new anonymous session
 * POST /api/session/start
 */
router.post('/start', (req, res) => {
    try {
        const sessionId = createAnonymousSession(
            req.ip,
            req.headers['user-agent'] || ''
        );
        
        res.json({
            success: true,
            sessionId,
            expiresIn: '30 minutes',
            message: 'Anonymous session created. Use this sessionId for subsequent requests.'
        });
        
    } catch (error) {
        console.error('Session creation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create session'
        });
    }
});

/**
 * Get verification token for a session
 * POST /api/session/verification-token
 */
router.post('/verification-token', (req, res) => {
    const sessionId = req.headers['x-session-id'];
    
    if (!sessionId) {
        return res.status(400).json({
            success: false,
            error: 'Session ID required in X-Session-ID header'
        });
    }
    
    try {
        const token = createVerificationToken(sessionId as string);
        
        res.json({
            success: true,
            token,
            expiresIn: '5 minutes',
            message: 'Use this token for verification requests. Token is single-use.'
        });
        
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to create verification token'
        });
    }
});

/**
 * Validate session (for testing)
 * GET /api/session/validate
 */
router.get('/validate', (req, res) => {
    const sessionId = req.headers['x-session-id'];
    
    if (!sessionId) {
        return res.status(400).json({
            valid: false,
            error: 'Session ID required'
        });
    }
    
    const validation = validateSession(sessionId as string);
    res.json(validation);
});

export default router;
