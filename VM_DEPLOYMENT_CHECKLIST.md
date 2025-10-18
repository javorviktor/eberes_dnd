# VM Deployment Checklist

## 1. Pull Changes
```bash
git pull origin main
```

## 2. Set Up Environment Variables
```bash
# Copy the production template
cp production.env.template .env

# Edit the .env file with proper values
nano .env
```

**Required changes in .env:**
- Set a secure JWT_SECRET (generate a strong random string)
- Verify NEXT_PUBLIC_API_URL=https://garagednd.botanyrobotics.com

## 3. Generate Secure JWT Secret
```bash
# Generate a secure JWT secret
openssl rand -base64 32
# Copy the output to JWT_SECRET in .env
```

## 4. Rebuild and Restart Containers
```bash
# Stop existing containers
docker-compose down

# Rebuild with new configuration
docker-compose build

# Start with production environment
NEXT_PUBLIC_API_URL=https://garagednd.botanyrobotics.com docker-compose up -d
```

## 5. Verify Deployment
```bash
# Check container status
docker-compose ps

# Check frontend environment
docker exec dnd_frontend printenv | grep NEXT_PUBLIC

# Test backend health
curl -k https://garagednd.botanyrobotics.com/health
```

## 6. SSL Certificate Verification
- Ensure your reverse proxy (nginx/Apache) has valid SSL certificates
- Verify HTTPS is working: `https://garagednd.botanyrobotics.com`
- Check that HTTP redirects to HTTPS

## 7. Database Migration (if needed)
```bash
# If you need to run migrations manually
docker-compose exec backend pnpm prisma migrate deploy
```

## 8. Test User Registration
- Try registering a new user
- Check browser network tab for any CORS errors
- Verify API calls are going to HTTPS endpoint

## 9. Monitor Logs
```bash
# Watch backend logs for errors
docker-compose logs -f backend

# Watch frontend logs
docker-compose logs -f frontend
```

## 10. Firewall/Security
- Ensure ports 3000 and 4000 are accessible through your reverse proxy
- Verify database port 5432 is NOT exposed externally
- Check that only HTTPS traffic reaches the application
