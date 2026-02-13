#!/bin/bash

# Quick Test Script for Digital Ocean Deployment
# Tests if backend is accessible on droplet

DROPLET_IP="139.59.32.39"

echo "🧪 Testing Digital Ocean Backend..."
echo ""

# Test 1: Check if server is reachable
echo "1️⃣ Testing server connectivity..."
if curl -f -s "http://${DROPLET_IP}:3001" > /dev/null 2>&1; then
    echo "   ✅ Server is reachable"
else
    echo "   ❌ Server is not reachable (might be normal if not deployed yet)"
fi

echo ""

# Test 2: Check specific endpoint (if you add a health check)
echo "2️⃣ Testing health endpoint..."
response=$(curl -s "http://${DROPLET_IP}:3001/api/users" 2>&1)
if [[ $? -eq 0 ]]; then
    echo "   ✅ API endpoint responded"
    echo "   Response sample: ${response:0:100}..."
else
    echo "   ❌ API endpoint not responding"
fi

echo ""
echo "🌐 Your backend URL: http://${DROPLET_IP}:3001"
echo "📝 Update this in your frontend .env file:"
echo "   VITE_API_URL=http://${DROPLET_IP}:3001"
