# 🚀 Worldbuilder - Deployment Guide

This guide covers deploying Worldbuilder itself (the platform) and the apps it generates.

---

## Part 1: Deploy Worldbuilder Platform

### **Option A: Docker Compose (Recommended for Development)**

```bash
# Clone repository
git clone <your-repo>
cd worldcreator

# Create environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit .env files with your keys
nano backend/.env
nano frontend/.env

# Start all services
docker-compose up -d

# Initialize database
docker-compose exec backend npx prisma db push

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Services:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### **Option B: Railway (Production)**

#### **Backend:**
```bash
cd backend

# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway init

# Add PostgreSQL
railway add postgresql

# Add Redis (if using workers)
railway add redis

# Set environment variables
railway variables set OPENAI_API_KEY=sk-xxx
railway variables set SUPABASE_URL=https://xxx.supabase.co
railway variables set SUPABASE_ANON_KEY=xxx
railway variables set FRONTEND_URL=https://your-frontend.vercel.app

# Deploy
railway up
```

#### **Frontend:**
```bash
cd frontend

# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_API_URL

# Deploy to production
vercel --prod
```

### **Option C: Manual VPS (DigitalOcean, AWS, etc.)**

```bash
# On your server
git clone <your-repo>
cd worldcreator

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Install Redis
sudo apt-get install redis-server

# Install dependencies
npm install
cd frontend && npm install
cd ../backend && npm install

# Set up environment
cp backend/.env.example backend/.env
# Edit with production values

# Build
cd frontend && npm run build
cd ../backend && npm run build

# Use PM2 to run
sudo npm install -g pm2
pm2 start backend/dist/index.js --name worldbuilder-api
pm2 startup
pm2 save

# Nginx reverse proxy
sudo apt-get install nginx
# Configure nginx for both frontend and backend
```

---

## Part 2: Deploy Generated Apps

When users generate apps with Worldbuilder, here's how to deploy them:

### **Option A: Railway (Easiest)**

**From Generated Code:**
```bash
# Navigate to generated project
cd your-generated-app

# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize
railway init

# Add PostgreSQL
railway add postgresql

# Add Redis (if app has workers)
railway add redis

# Set environment variables from .env.example
railway variables set DATABASE_URL=xxx
railway variables set SENDGRID_API_KEY=xxx  # if using email
railway variables set STRIPE_SECRET_KEY=xxx # if using payments

# Deploy
railway up

# Get deployment URL
railway domain
```

**That's it!** App is live at `https://your-app.up.railway.app`

### **Option B: Docker (Any Platform)**

```bash
# Build image
docker build -t my-app .

# Run locally
docker-compose up

# Deploy to any Docker host
docker push your-registry/my-app
```

### **Option C: Heroku**

```bash
# Login
heroku login

# Create app
heroku create my-app-name

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Add Redis (if workers)
heroku addons:create heroku-redis:mini

# Set environment variables
heroku config:set OPENAI_API_KEY=xxx
heroku config:set SENDGRID_API_KEY=xxx

# Deploy
git push heroku main

# Open app
heroku open
```

### **Option D: Vercel (Serverless)**

**Note:** Generated apps are currently optimized for long-running servers. For Vercel, you'd need to adapt to serverless functions.

---

## Part 3: Production Checklist

### **Before Going Live:**

#### **Security:**
- [ ] Change all default passwords
- [ ] Use strong secret keys
- [ ] Enable HTTPS only
- [ ] Set CORS to specific origins
- [ ] Enable rate limiting
- [ ] Set up WAF (Cloudflare)
- [ ] Regular security scans

#### **Database:**
- [ ] Enable connection pooling
- [ ] Set up backups (automated)
- [ ] Create read replicas (if needed)
- [ ] Monitor query performance
- [ ] Set up alerts for downtime

#### **Monitoring:**
- [ ] Set up error tracking (Sentry)
- [ ] Enable logging (Winston → Elasticsearch)
- [ ] Add uptime monitoring (UptimeRobot)
- [ ] Set up alerts (PagerDuty, email)
- [ ] Create dashboards (Grafana)

#### **Performance:**
- [ ] Enable Redis caching
- [ ] Add CDN for static assets
- [ ] Optimize database queries
- [ ] Enable gzip compression
- [ ] Set up load balancing

#### **Legal:**
- [ ] Privacy policy
- [ ] Terms of service
- [ ] GDPR compliance (if EU)
- [ ] Cookie consent

---

## Part 4: Scaling

### **Horizontal Scaling (Multiple Instances)**

```bash
# Railway
railway scale --replicas 3

# Docker Swarm
docker stack deploy -c docker-compose.yml worldbuilder

# Kubernetes
kubectl apply -f k8s/
kubectl scale deployment worldbuilder --replicas=3
```

### **Vertical Scaling (More Resources)**

```bash
# Railway
railway scale --memory 2GB --cpu 2

# Docker
docker update --memory=2g --cpus=2 container-name
```

### **Database Scaling**

```bash
# Add read replicas
# Enable connection pooling
# Use PgBouncer
# Cache frequently accessed data
```

---

## Part 5: Monitoring & Maintenance

### **Health Checks**

All generated apps include `/health` endpoint:
```bash
curl https://your-app.com/health
# Response: {"status":"ok","project":"My App"}
```

### **Logs**

```bash
# Railway
railway logs

# Docker
docker-compose logs -f

# PM2
pm2 logs
```

### **Database Backups**

```bash
# Supabase - automatic daily backups
# Railway - automatic backups

# Manual backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### **Updates**

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Run migrations
npx prisma migrate deploy

# Restart services
pm2 restart all
# OR
docker-compose restart
# OR
railway up
```

---

## Part 6: Cost Estimates

### **Worldbuilder Platform**

**Development:**
- Railway (Starter): $5/month
- Supabase (Free): $0/month
- OpenAI API: $50-200/month
- **Total: ~$55-205/month**

**Production (1,000 users):**
- Railway (Pro): $20-50/month
- Supabase (Pro): $25/month
- OpenAI API: $500-1000/month
- **Total: ~$545-1,075/month**

### **Generated Apps**

**Small (< 1,000 users):**
- Railway: $5-10/month
- Supabase: Free
- Redis: $5/month
- **Total: ~$10-15/month**

**Medium (1,000-10,000 users):**
- Railway: $20-50/month
- Supabase Pro: $25/month
- Redis: $10/month
- **Total: ~$55-85/month**

**Large (10,000+ users):**
- Railway: $100-200/month
- Supabase Pro+: $100/month
- Redis: $20/month
- CDN: $20/month
- **Total: ~$240-340/month**

---

## Part 7: Troubleshooting

### **Deployment Fails**

```bash
# Check logs
railway logs
# OR
docker-compose logs

# Common issues:
# - Missing environment variables
# - Database connection failed
# - Port conflicts
# - Out of memory
```

### **Database Connection Issues**

```bash
# Test connection
psql $DATABASE_URL

# Check if IP is whitelisted (Supabase)
# Check if using correct connection mode (Transaction vs Session)
```

### **High Memory Usage**

```bash
# Increase container memory
railway scale --memory 2GB

# OR optimize code:
# - Add connection pooling
# - Reduce concurrent workers
# - Enable caching
```

---

## Part 8: Best Practices

### **Environment Variables**
- Never commit `.env` files
- Use Railway/Vercel environment management
- Rotate secrets regularly
- Use separate configs for dev/staging/prod

### **Database**
- Always run migrations, never direct schema changes
- Keep backups before major updates
- Test migrations on staging first
- Monitor query performance

### **Monitoring**
- Set up alerts for errors
- Monitor response times
- Track user activity
- Check disk space regularly

### **Security**
- Keep dependencies updated
- Run security audits (`npm audit`)
- Use HTTPS everywhere
- Implement rate limiting
- Validate all inputs

---

## 🎉 Deploy Your First App!

**Quick Deploy to Railway:**

1. Generate your app in Worldbuilder
2. Push to GitHub
3. Connect Railway to GitHub repo
4. Add PostgreSQL & Redis
5. Set environment variables
6. Deploy automatically
7. **App is live!** 🚀

---

For more help:
- Railway Docs: https://docs.railway.app
- Supabase Docs: https://supabase.com/docs
- Docker Docs: https://docs.docker.com

**Happy deploying!** 🌍✨

