# 🚀 Simple Ubuntu Server Deployment Guide

## Prerequisites (One-time setup on Ubuntu server)

### 1. Install Docker and Docker Compose
```bash
# Update package index
sudo apt update

# Install Docker
sudo apt install -y docker.io

# Install Docker Compose
sudo apt install -y docker-compose

# Add your user to docker group (so you don't need sudo)
sudo usermod -aG docker $USER

# Log out and back in, or run:
newgrp docker
```

### 2. Verify Installation
```bash
docker --version
docker-compose --version
```

## Quick Start (Testing Phase)

### 1. Copy Files to Ubuntu Server
```bash
# Copy the entire project folder to your Ubuntu server (192.168.0.130)
scp -r /path/to/eberes_dnd user@192.168.0.130:/home/user/
```

### 2. Deploy on Ubuntu Server
```bash
# SSH into your Ubuntu server
ssh user@192.168.0.130

# Navigate to the project folder
cd eberes_dnd

# If this is the first time, run the setup script
./setup-ubuntu.sh
# Then log out and back in, or run: newgrp docker

# Make the deployment script executable
chmod +x deploy-vm.sh

# Run the simple deployment script
./deploy-vm.sh
```

### 3. Access the App
- **Direct VM access**: http://192.168.0.130:3000
- **Production domain**: https://garagednd.botanyrobotics.com

## What the Script Does
1. ✅ Stops any running containers
2. ✅ Builds and starts all services
3. ✅ Waits for services to be ready
4. ✅ Tests backend health
5. ✅ Shows access URLs

## Troubleshooting

### If you get network errors:
1. **Check if containers are running**:
   ```bash
   docker-compose ps
   ```

2. **Check logs**:
   ```bash
   docker-compose logs -f
   ```

3. **Restart if needed**:
   ```bash
   docker-compose down
   docker-compose up --build -d
   ```

### If the domain doesn't work:
- Make sure your reverse proxy (192.168.0.124) is configured correctly
- Check that the proxy forwards to 192.168.0.130:3000 and 192.168.0.130:4000

## Configuration
- **No .env file needed** for testing
- **JWT Secret**: Uses `dev_secret` (fine for testing)
- **API URL**: Automatically uses the correct URL based on how you access it
- **Database**: PostgreSQL on port 5432
- **Backend**: Express.js on port 4000
- **Frontend**: Next.js on port 3000

## Stop the App
```bash
docker-compose down
```

## Update the App
```bash
# Pull latest changes, then:
./deploy-vm.sh
```
