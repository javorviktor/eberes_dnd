#!/bin/bash

# Ubuntu Server Setup Script for D&D App
# Run this script ONCE on your Ubuntu server to install Docker

echo "🐧 Setting up Ubuntu server for D&D App..."

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please don't run this script as root. Run as a regular user."
    exit 1
fi

# Update package index
echo "📦 Updating package index..."
sudo apt update

# Install Docker
echo "🐳 Installing Docker..."
sudo apt install -y docker.io

# Install Docker Compose
echo "🔧 Installing Docker Compose..."
sudo apt install -y docker-compose

# Add user to docker group
echo "👤 Adding user to docker group..."
sudo usermod -aG docker $USER

# Enable Docker service
echo "🚀 Enabling Docker service..."
sudo systemctl enable docker
sudo systemctl start docker

echo ""
echo "✅ Setup complete!"
echo ""
echo "⚠️  IMPORTANT: You need to log out and back in for the docker group changes to take effect."
echo "   Or run: newgrp docker"
echo ""
echo "🔍 To verify installation:"
echo "   docker --version"
echo "   docker-compose --version"
echo ""
echo "🚀 After logging back in, you can run: ./deploy-vm.sh"
