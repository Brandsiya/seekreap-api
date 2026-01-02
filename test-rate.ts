import { checkSessionLimit } from './services/rate-limit.ts';

console.log('Test 1 - First engagement request:', checkSessionLimit('test-1', '/engagements'));
console.log('Test 2 - Same session, second request:', checkSessionLimit('test-1', '/engagements'));
console.log('Test 3 - Different session:', checkSessionLimit('test-2', '/engagements'));
console.log('Test 4 - General endpoint:', checkSessionLimit('test-1', '/api/users'));
