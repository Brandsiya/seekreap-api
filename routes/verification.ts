import { Router } from 'express';
import { requireSession, requireVerificationToken } from '../middleware/auth';
import { validateAndCompleteVerification } from '../services/session';

const router = Router();

// Apply session middleware to all verification routes
router.use(requireSession);

/**
 * Start verification process
 * POST /api/verification/start
 */
router.post('/start', (req, res) => {
    const { adId, userId } = req.body;
    
    if (!adId) {
        return res.status(400).json({
            success: false,
            error: 'adId is required'
        });
    }
    
    // In Phase 1, userId is optional/anon
    const anonUserId = userId || `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store verification attempt (simplified)
    const verificationId = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    res.json({
        success: true,
        verificationId,
        userId: anonUserId,
        nextStep: 'watch_ad', // or 'answer_questions' depending on flow
        message: 'Verification process started'
    });
});

/**
 * Submit verification answers (protected with verification token)
 * POST /api/verification/submit
 */
router.post('/submit', requireVerificationToken, (req, res) => {
    const { verificationId, answers } = req.body;
    const sessionId = req.sessionId;
    const verificationToken = req.verificationToken;
    
    if (!verificationId || !answers) {
        return res.status(400).json({
            success: false,
            error: 'verificationId and answers are required'
        });
    }
    
    // Validate and mark verification token as used
    const isValid = validateAndCompleteVerification(verificationToken, sessionId);
    if (!isValid) {
        return res.status(401).json({
            success: false,
            error: 'Invalid or expired verification token'
        });
    }
    
    // Simple deterministic verification logic (Phase 1 spec)
    // Fixed questions with expected answers
    const expectedAnswers = ['A', 'B', 'C']; // Example expected answers
    const isCorrect = JSON.stringify(answers) === JSON.stringify(expectedAnswers);
    
    const result = {
        verificationId,
        sessionId,
        verified: isCorrect,
        timestamp: new Date().toISOString(),
        score: isCorrect ? 100 : 0
    };
    
    // Log verification result (in production, save to database)
    console.log('Verification result:', result);
    
    res.json({
        success: true,
        result,
        message: isCorrect ? 'Verification successful' : 'Verification failed'
    });
});

/**
 * Get verification result
 * GET /api/verification/result/:verificationId
 */
router.get('/result/:verificationId', (req, res) => {
    const { verificationId } = req.params;
    
    // In production, fetch from database
    // For now, return mock response
    res.json({
        success: true,
        verificationId,
        verified: Math.random() > 0.5, // 50/50 for demo
        completed: true,
        timestamp: new Date().toISOString()
    });
});

export default router;
