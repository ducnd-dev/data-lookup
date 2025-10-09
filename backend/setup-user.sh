#!/bin/bash

# Setup admin user for testing
echo "🔧 Setting up admin user..."

# Register admin user
echo "📝 Creating admin user..."
REGISTER_RESPONSE=$(curl -s -X POST "http://localhost:3000/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "admin@example.com",
        "password": "admin123",
        "fullName": "Admin User"
    }')

echo "📋 Register response:"
echo "$REGISTER_RESPONSE" | jq . 2>/dev/null || echo "$REGISTER_RESPONSE"

# Try to login
echo "🔑 Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:3000/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "admin@example.com",
        "password": "admin123"
    }')

echo "📋 Login response:"
echo "$LOGIN_RESPONSE" | jq . 2>/dev/null || echo "$LOGIN_RESPONSE"

if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
    echo "✅ Admin user setup successful!"
else
    echo "❌ Login failed, but user might already exist"
fi