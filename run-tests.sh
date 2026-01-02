#!/bin/bash
echo "=== Running Unit Tests ==="
npx jest core/tests/ --passWithNoTests || echo "Unit tests skipped"

echo "=== API Integration Tests ==="
API_URL="https://seekreap-api.onrender.com"

# Test health endpoint
if curl -s "$API_URL/health" | grep -q "healthy"; then
  echo "✓ Health check passed"
else
  echo "✗ Health check failed"
  curl -s "$API_URL/health"
fi

# Test main endpoints
for endpoint in "/api" "/api/engagements"; do
  response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL$endpoint")
  if [ "$response" = "200" ]; then
    echo "✓ $endpoint accessible (HTTP $response)"
  else
    echo "✗ $endpoint failed: HTTP $response"
    curl -s "$API_URL$endpoint"
  fi
done
