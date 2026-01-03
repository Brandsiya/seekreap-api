// routes/verification.ts - Enhanced version
import { Router } from 'express';
import { requireSession } from '../middleware/auth';
import { EnhancedVerificationService } from '../services/enhanced-verification.service';

const router = Router();
const verificationService = new EnhancedVerificationService();

// Apply session middleware
router.use(requireSession);

/**
 * Enhanced verification endpoint
 * POST /api/verification/complete
 * Combines Q&A answers with engagement events
 */
router.post('/complete', async (req, res) => {
  const { 
    verificationId, 
    adId, 
    answers, 
    engagementEvents = [],
    userId = 'anonymous'
  } = req.body;

  // Validate required fields
  if (!verificationId || !adId || !answers) {
    return res.status(400).json({
      success: false,
      error: 'verificationId, adId, and answers are required'
    });
  }

  try {
    // Process using enhanced verification service
    const result = await verificationService.processVerification(
      verificationId,
      adId,
      userId,
      answers,
      engagementEvents
    );

    // Format response for frontend
    const response = {
      success: true,
      verificationId: result.verificationId,
      outcome: result.finalOutcome,
      score: Math.round(100 - (result.behavioralRiskScore * 100)),
      qaScore: result.qaScore,
      creditsAwarded: result.creditsAwarded,
      details: {
        behavioralAnalysis: {
          riskScore: result.behavioralRiskScore,
          engagementState: result.engagementState,
          eventCount: result.eventCount
        },
        qaAnalysis: {
          correct: result.qaCorrect,
          total: result.qaTotal,
          score: result.qaScore
        },
        combinedRisk: result.behavioralRiskScore, // Your engine's calculated risk
        auditTrailId: result.auditTrailId
      },
      timestamp: result.completedAt.toISOString()
    };

    res.json(response);

  } catch (error) {
    console.error('Verification processing error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to process verification',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get detailed verification results
 * GET /api/verification/results/:verificationId
 */
router.get('/results/:verificationId', async (req, res) => {
  const { verificationId } = req.params;
  
  try {
    const result = await verificationService.getVerificationResult(verificationId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Verification result not found'
      });
    }
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('Error fetching verification result:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch verification result'
    });
  }
});

export default router;
