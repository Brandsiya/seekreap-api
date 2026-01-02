"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSessionLimit = checkSessionLimit;
const limits = new Map();
function checkRateLimit(key, windowMs, max) {
    const now = Date.now();
    const limit = limits.get(key);
    if (!limit || now > limit.resetAt) {
        limits.set(key, { count: 1, resetAt: now + windowMs });
        return true;
    }
    if (limit.count >= max)
        return false;
    limit.count += 1;
    limits.set(key, limit);
    return true;
}
function checkSessionLimit(sessionId, endpoint) {
    if (endpoint.includes('/engagements')) {
        return checkRateLimit(`verification:${sessionId}`, 15 * 60 * 1000, 10);
    }
    return checkRateLimit(`general:${sessionId}`, 60 * 60 * 1000, 100);
}
