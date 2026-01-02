import { validateSession } from '../services/session';

import { checkSessionLimit } from '../services/rate-limit';

/**

 * Middleware for anonymous session validation

 */

export function requireSession(req: any, res: any, next: Function) {

    const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;

    

    if (!sessionId) {

        return res.status(401).json({ 

            error: 'Unauthorized',

            message: 'Session ID required. Start a new session at /api/session/start'

        });

    }

    

    const validation = validateSession(sessionId);

    if (!validation.valid) {

        return res.status(401).json({ 

            error: 'Unauthorized',

            message: validation.error || 'Invalid session'

        });

    }

    

    // Apply rate limiting

    if (!checkSessionLimit(sessionId, req.path)) {

        return res.status(429).json({ 

            error: 'Too Many Requests',

            message: 'Rate limit exceeded. Please wait before making more requests.'

        });

    }

    

    req.sessionId = sessionId;

    next();

}

/**

 * Middleware for verification-specific endpoints

 */

export function requireVerificationToken(req: any, res: any, next: Function) {

    const sessionId = req.sessionId;

    const verificationToken = req.headers['x-verification-token'];

    

    if (!verificationToken) {

        return res.status(401).json({ 

            error: 'Unauthorized',

            message: 'Verification token required'

        });

    }

    

    // In a real implementation, you would validate the verification token

    // For now, we'll just check that it exists and the session is valid

    req.verificationToken = verificationToken;

    next();

}

/**

 * Create session on first request (for clients that don't have one)

 */

export function createSessionIfMissing(req: any, res: any, next: Function) {

    const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;

    

    if (!sessionId) {

        // Create new anonymous session

        const { createAnonymousSession } = require('../services/session');

        const newSessionId = createAnonymousSession(

            req.ip,

            req.headers['user-agent'] || ''

        );

        

        req.sessionId = newSessionId;

        res.setHeader('X-New-Session-ID', newSessionId);

    } else {

        req.sessionId = sessionId;

    }

    

    next();

}