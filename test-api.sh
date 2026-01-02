#!/bin/bash
echo "=== Testing SeekReap Phase 1 API ==="

# 1. Health check
echo -e "\n1. Health check:"
curl -s http://localhost:3000/health | jq .

# 2. Create session
echo -e "\n2. Creating session:"
SESSION_RESPONSE=$(curl -s -X POST http://localhost:3000/api/session/start -H "Content-Type: application/json" -d '{}')
echo $SESSION_RESPONSE | jq .
SESSION_ID=$(echo $SESSION_RESPONSE | jq -r '.sessionId')

if [ "$SESSION_ID" = "null" ]; then
    echo "Failed to get session ID"
    exit 1
fi

# 3. Get verification token
echo -e "\n3. Getting verification token:"
curl -s -X POST http://localhost:3000/api/session/verification-token \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: $SESSION_ID" \
  -d '{}' | jq .

# 4. Start verification
echo -e "\n4. Starting verification:"
curl -s -X POST http://localhost:3000/api/verification/start \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: $SESSION_ID" \
  -d '{"adId": "test_ad_001"}' | jq .

echo -e "\n=== Test complete ==="
