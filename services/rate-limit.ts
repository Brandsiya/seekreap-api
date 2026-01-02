const limits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, windowMs: number, max: number): boolean {

    const now = Date.now();

    const limit = limits.get(key);

    

    if (!limit || now > limit.resetAt) {

        limits.set(key, { count: 1, resetAt: now + windowMs });

        return true;

    }

    if (limit.count >= max) return false;

    limit.count += 1;

    limits.set(key, limit);

    return true;

}

export function checkSessionLimit(sessionId: string, endpoint: string): boolean {

    if (endpoint.includes('/engagements')) {

        return checkRateLimit(`verification:${sessionId}`, 15 * 60 * 1000, 10);

    }

    return checkRateLimit(`general:${sessionId}`, 60 * 60 * 1000, 100);

}