# Deployment Guide: School Management System

## 🚀 Quick Deployment to Vercel

### Prerequisites
- GitHub account
- Vercel account (free)
- Supabase account (free)

### Step 1: Database Setup (Supabase)

1. **Create Supabase Project**
   ```bash
   # Go to https://supabase.com
   # Click "New Project"
   # Choose organization and set:
   # - Name: school-management-db
   # - Password: [secure password]
   # - Region: [closest to you]
   ```

2. **Get Database URLs**
   ```bash
   # In Supabase Dashboard -> Settings -> Database
   # Copy these URLs:
   DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres"
   DATABASE_DIRECT_URL="postgresql://postgres:[password]@[host]:5432/postgres"
   ```

3. **Run Database Migrations**
   ```bash
   # Locally first:
   npm run db:migrate
   
   # Then apply RLS migration:
   # Run the SQL in: prisma/migrations/add_row_level_security.sql
   # In Supabase Dashboard -> SQL Editor
   ```

### Step 2: Vercel Deployment

1. **Connect GitHub Repository**
   ```bash
   # Push your code to GitHub
   git add .
   git commit -m "ready for deployment"
   git push origin main
   
   # Go to https://vercel.com
   # Click "New Project"
   # Import from GitHub
   # Select your repository
   ```

2. **Configure Environment Variables**
   ```bash
   # In Vercel Dashboard -> Settings -> Environment Variables
   # Add these variables:
   ```

   **Required Variables:**
   ```
   DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
   DATABASE_DIRECT_URL=postgresql://postgres:[password]@[host]:5432/postgres
   JWT_SECRET=[generate with: openssl rand -base64 32]
   NEXTAUTH_SECRET=[generate with: openssl rand -base64 32]
   NEXTAUTH_URL=https://your-app.vercel.app
   VERCEL_BLOB_READ_WRITE_TOKEN=[from Vercel Storage tab]
   CRON_SECRET=[generate with: openssl rand -base64 32]
   ```

   **Optional Variables:**
   ```
   BCRYPT_ROUNDS=12
   PASSWORD_MIN_LENGTH=8
   SESSION_TIMEOUT_HOURS=8
   RATE_LIMIT_MAX=100
   RATE_LIMIT_WINDOW=60000
   ```

3. **Enable Vercel Blob Storage**
   ```bash
   # In Vercel Dashboard -> Storage -> Blob
   # Click "Create Blob Store"
   # Copy the read/write token
   # Add as VERCEL_BLOB_READ_WRITE_TOKEN
   ```

4. **Deploy**
   ```bash
   # Vercel automatically builds and deploys
   # Check deployment at: https://your-app.vercel.app
   ```

### Step 3: Post-Deployment Setup

1. **Initialize Superadmin**
   ```bash
   # Access: https://your-app.vercel.app/login
   # Login with:
   # Username: superadmin
   # Password: super123
   ```

2. **Create First School**
   ```bash
   # Go to: https://your-app.vercel.app/superadmin
   # Click "Add School"
   # Fill in school details
   # Save admin credentials shown
   ```

3. **Test Image Upload**
   ```bash
   # Login as school admin
   # Go to student registration
   # Upload 5-20 photos
   # Verify photos appear in Vercel Blob storage
   ```

4. **Sync Training Data**
   ```bash
   # Manually trigger sync:
   # GET https://your-app.vercel.app/api/cron/sync-training-data
   # With header: Authorization: Bearer [CRON_SECRET]
   ```

## 🔧 Local Development Setup

### Initial Setup
```bash
# Clone repository
git clone [your-repo-url]
cd school-management-system

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your local settings
# At minimum, set:
# - DATABASE_URL (local PostgreSQL)
# - JWT_SECRET (any 32+ char string for dev)
# - NEXTAUTH_SECRET (any 32+ char string for dev)
```

### Database Setup
```bash
# Start local PostgreSQL
# Create database:
createdb school_management

# Run migrations
npm run db:migrate

# Apply RLS (copy/paste SQL from migrations file)
# Or connect to Supabase for development
```

### Start Development
```bash
# Start development server
npm run dev

# Open: http://localhost:3000
# Login: superadmin / super123
```

## 📊 Cost Breakdown

### FREE Tier (Development & Testing)
```
✅ Vercel Hobby: $0/month
   - Unlimited projects
   - 100GB bandwidth
   - Serverless functions

✅ Supabase Free: $0/month
   - 500MB database
   - 50K monthly active users
   - Realtime subscriptions

✅ Vercel Blob: $0/month
   - 1GB storage included

Total: $0/month
```

### Production Tier (Real Usage)
```
💰 Vercel Pro: $20/month
   - Custom domains
   - Analytics
   - Team features

💰 Supabase Pro: $25/month
   - 8GB database
   - 500K monthly active users
   - Daily backups

💰 Additional Storage: ~$1/month
   - $0.15/GB for extra blob storage
   - ~7GB for 1000 students with photos

Total: ~$46/month
```

## 🔐 Security Checklist

### Pre-Deployment
- [ ] Strong JWT secrets (32+ characters)
- [ ] Strong NextAuth secrets (32+ characters)
- [ ] Database connection secured
- [ ] Environment variables set correctly
- [ ] No secrets in code/git

### Post-Deployment
- [ ] Test all user roles login
- [ ] Verify school data isolation
- [ ] Test photo upload/download
- [ ] Check API rate limiting
- [ ] Verify HTTPS redirect
- [ ] Test error handling

## 🚨 Troubleshooting

### Common Issues

**1. Database Connection Failed**
```bash
# Check DATABASE_URL format
# Verify Supabase project is running
# Check firewall/network restrictions
```

**2. File Upload Failed**
```bash
# Verify VERCEL_BLOB_READ_WRITE_TOKEN
# Check file size limits (10MB max)
# Verify file types (JPG/PNG/WebP only)
```

**3. Authentication Issues**
```bash
# Check JWT_SECRET length (must be 32+ chars)
# Verify NEXTAUTH_URL matches deployment URL
# Clear browser cookies/localStorage
```

**4. Build Failures**
```bash
# Check TypeScript errors
# Verify all dependencies installed
# Check environment variables in build
```

**5. RLS Not Working**
```bash
# Verify RLS migration was applied
# Check database policies are enabled
# Verify middleware sets security context
```

## 📈 Monitoring & Maintenance

### Automatic Monitoring
- Vercel Analytics (included)
- Error logging via console
- Performance metrics
- Uptime monitoring

### Manual Checks
- Daily: Check error logs
- Weekly: Verify backups
- Monthly: Update dependencies
- Quarterly: Security audit

### Scaling Considerations
- Database connection pooling configured
- Serverless functions auto-scale
- File storage scales automatically
- Consider Redis for caching at 1000+ users

## 🆘 Support

### Get Help
1. Check deployment logs in Vercel Dashboard
2. Check database logs in Supabase Dashboard
3. Review this deployment guide
4. Check GitHub issues

### Emergency Contacts
- Vercel Support: https://vercel.com/help
- Supabase Support: https://supabase.com/support
- Database Issues: Check Supabase status page