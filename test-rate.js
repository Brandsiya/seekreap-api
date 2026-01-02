// Rate Limiter Test

const { checkSessionLimit } = require('./rate-limit.js');

console.log('=== Rate Limiter Test ===\n');

// Test engagements endpoint (10 per 15 min)

console.log('Engagements endpoint (max 10 per 15 min):');

for (let i = 1; i <= 12; i++) {

    const allowed = checkSessionLimit('session-1', '/api/engagements');

    console.log(`  Request ${i}: ${allowed ? '✓ ALLOWED' : '✗ BLOCKED (rate limit)'}`);

}

console.log('\nGeneral endpoint (max 100 per hour):');

for (let i = 1; i <= 5; i++) {

    const allowed = checkSessionLimit('session-2', '/api/users');

    console.log(`  Request ${i}: ${allowed ? '✓ ALLOWED' : '✗ BLOCKED'}`);

}

console.log('\nDifferent sessions have separate limits:');

console.log(`  Session A request 1: ${checkSessionLimit('session-a', '/engagements')}`);

console.log(`  Session B request 1: ${checkSessionLimit('session-b', '/engagements')}`);

console.log(`  Session A request 11: ${checkSessionLimit('session-a', '/engagements')}`);

console.log(`  Session B request 2: ${checkSessionLimit('session-b', '/engagements')}`);