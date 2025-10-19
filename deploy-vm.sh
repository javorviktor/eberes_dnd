#!/bin/bash

# Simple Ubuntu Server Deployment Script for D&D App Testing
# Run this script on the Ubuntu server (192.168.0.130)

echo "🚀 Deploying D&D App to Ubuntu Server (Testing Mode)..."

# Stop any running containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build and start containers (no .env file needed!)
echo "🔨 Building and starting containers..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 15

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

# Test the health endpoint
echo "🏥 Testing backend health..."
curl -f http://localhost:4000/health && echo "✅ Backend is healthy!" || echo "❌ Backend health check failed"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Access URLs:"
echo "   - Direct VM access: http://192.168.0.130:3000"
echo "   - Production domain: https://garagednd.botanyrobotics.com"
echo ""
echo "📊 To view logs: docker-compose logs -f"
echo "🛑 To stop: docker-compose down"
