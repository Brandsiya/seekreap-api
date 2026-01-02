// Lightweight anonymous session management for Phase 1

// No PII, no user accounts, no passwords

interface AnonymousSession {

    id: string;

    createdAt: Date;

    expiresAt: Date;

    ipAddress: string;

    userAgent: string;

    deviceFingerprint?: string; // Non-PII, optional

    verificationCompleted: boolean;

}

const sessions = new Map<string, AnonymousSession>();

const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes per spec

const VERIFICATION_SESSION_DURATION = 5 * 60 * 1000; // 5 minutes for verification flow

/**

 * Create a new anonymous session

 */

export function createAnonymousSession(ipAddress: string, userAgent: string): string {

    const sessionId = generateSessionId();

    

    const session: AnonymousSession = {

        id: sessionId,

        createdAt: new Date(),

        expiresAt: new Date(Date.now() + SESSION_DURATION),

        ipAddress,

        userAgent,

        verificationCompleted: false

    };

    

    sessions.set(sessionId, session);

    return sessionId;

}

/**

 * Validate a session (for general API access)

 */

export function validateSession(sessionId: string): { valid: boolean; error?: string } {

    if (!sessionId) {

        return { valid: false, error: 'No session provided' };

    }

    

    const session = sessions.get(sessionId);

    if (!session) {

        return { valid: false, error: 'Session not found' };

    }

    

    if (new Date() > session.expiresAt) {

        sessions.delete(sessionId);

        return { valid: false, error: 'Session expired' };

    }

    

    return { valid: true };

}

/**

 * Create a verification-specific token (bound to single flow)

 */

export function createVerificationToken(sessionId: string): string {

    const session = sessions.get(sessionId);

    if (!session) {

        throw new Error('Invalid session');

    }

    

    if (session.verificationCompleted) {

        throw new Error('Verification already completed for this session');

    }

    

    const token = generateVerificationToken(sessionId);

    

    // Update session to mark verification in progress

    session.expiresAt = new Date(Date.now() + VERIFICATION_SESSION_DURATION);

    sessions.set(sessionId, session);

    

    return token;

}

/**

 * Validate verification token and mark verification complete

 */

export function validateAndCompleteVerification(token: string, sessionId: string): boolean {

    if (!isValidVerificationToken(token, sessionId)) {

        return false;

    }

    

    const session = sessions.get(sessionId);

    if (!session) {

        return false;

    }

    

    // Mark verification as completed (token cannot be reused)

    session.verificationCompleted = true;

    sessions.set(sessionId, session);

    

    return true;

}

/**

 * Clean up expired sessions (call periodically)

 */

export function cleanupExpiredSessions(): number {

    const now = new Date();

    let deleted = 0;

    

    // Using forEach to avoid downlevelIteration issues

    sessions.forEach((session, id) => {

        if (now > session.expiresAt) {

            sessions.delete(id);

            deleted++;

        }

    });

    

    return deleted;

}

// Helper functions

function generateSessionId(): string {

    return 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);

}

function generateVerificationToken(sessionId: string): string {

    // Simple hash-based token bound to session

    const timestamp = Date.now();

    return 'verify_' + Buffer.from(`${sessionId}:${timestamp}`).toString('base64url');

}

function isValidVerificationToken(token: string, sessionId: string): boolean {

    if (!token.startsWith('verify_')) return false;

    

    try {

        const decoded = Buffer.from(token.substring(7), 'base64url').toString();

        const [tokenSessionId, timestamp] = decoded.split(':');

        

        // Token must match session and be recent (within 5 minutes)

        return tokenSessionId === sessionId && 

               Date.now() - parseInt(timestamp) < VERIFICATION_SESSION_DURATION;

    } catch {

        return false;

    }

}

// Export for testing

export function getSessionCount(): number {

    return sessions.size;

}