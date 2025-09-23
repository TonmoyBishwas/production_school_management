# Deployment Environment Variables

## 🔐 Vercel Environment Variables Configuration

Copy these variables to Vercel Dashboard -> Settings -> Environment Variables:

### **Database Configuration**
```
DATABASE_URL=postgresql://postgres:ForgetSecure12345l@db.bhbvqmsjnotzncblicjq.supabase.co:5432/postgres
DATABASE_DIRECT_URL=postgresql://postgres:ForgetSecure12345l@db.bhbvqmsjnotzncblicjq.supabase.co:5432/postgres
```

### **Security Secrets** (✅ Generated)
```
JWT_SECRET=jUb71jBn2EzdqKZ6CjGtPw1uhJXmiZlyMEGVAYBv78w=
JWT_EXPIRES_IN=8h
NEXTAUTH_SECRET=MyE3txOeLjSUIFOxfggujGMA33Ps987i6zXQMWt0Cg0=
CRON_SECRET=enuSCMa4LEBvSJBOQB8C8mZCgfWcUMsyJdNHYIOhk2Q=
```

### **Supabase Configuration** (✅ Ready)
```
NEXT_PUBLIC_SUPABASE_URL=https://bhbvqmsjnotzncblicjq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoYnZxbXNqbm90em5jYmxpY2pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NDIxMTEsImV4cCI6MjA3NDExODExMX0.Maw3cU7EPq8qTYkvwskrcjt3OWEAJefTzOkAk7XTJmc
```

### **Application Configuration**
```
NEXTAUTH_URL=https://production-school-management.vercel.app
NODE_ENV=production
APP_NAME=School Management System
APP_VERSION=1.0.0
```

### **Security Settings**
```
BCRYPT_ROUNDS=12
PASSWORD_MIN_LENGTH=8
SESSION_TIMEOUT_HOURS=8
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000
```

### **File Storage** (⏳ To be configured)
```
VERCEL_BLOB_READ_WRITE_TOKEN=[Get from Vercel Blob Storage]
```

## 🚀 Quick Deployment Steps

### 1. Vercel Setup
```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Login to Vercel
vercel login

# Link project
vercel link
```

### 2. Environment Variables
- Go to Vercel Dashboard
- Select your project
- Go to Settings → Environment Variables
- Add all variables above (replace placeholders)

### 3. Enable Vercel Blob Storage
- Go to Storage tab in Vercel Dashboard
- Create Blob Store
- Copy the read/write token
- Add as `VERCEL_BLOB_READ_WRITE_TOKEN`

### 4. Deploy
```bash
# Deploy to production
vercel --prod
```

## 🔑 Login Credentials

### Superadmin Access
```
Username: superadmin
Password: super123
URL: https://your-app.vercel.app/login
```

## 📊 Database Information

### Supabase Project Details
- **Project ID**: bhbvqmsjnotzncblicjq
- **Region**: ap-southeast-1
- **Database**: PostgreSQL 17.6
- **Status**: ✅ Active and Healthy
- **RLS**: ✅ Enabled with school-based isolation policies

### Tables Created (✅ Complete)
- organizations
- schools
- users
- students
- teachers
- parents
- subjects
- attendance
- schedules
- academic_calendar
- exams
- grades
- homework
- student_photos

### Security Features (✅ Implemented)
- Row Level Security (RLS) enabled
- School-based data isolation
- Superadmin-only organization access
- Secure password hashing (bcrypt)
- JWT token authentication

## 🎯 Next Steps

1. **Configure Vercel Blob Storage**
2. **Deploy to Vercel**
3. **Test all functionality**
4. **Create comprehensive documentation**
5. **Set up image sync for face recognition**

## 🆘 Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL format
- Check Supabase project status
- Ensure password is correct

### Authentication Issues
- Verify JWT_SECRET length (32+ chars)
- Check NEXTAUTH_URL matches deployment URL
- Clear browser cookies

### File Upload Issues
- Verify VERCEL_BLOB_READ_WRITE_TOKEN
- Check file size limits (10MB max)
- Verify file types (JPG/PNG/WebP only)

## 💰 Cost Breakdown

### Current Setup
- **Supabase**: Free tier (500MB, 50K users)
- **Vercel**: Free tier (100GB bandwidth)
- **Total**: $0/month

### Production Scale
- **Supabase Pro**: $25/month (8GB, 500K users)
- **Vercel Pro**: $20/month (custom domains, analytics)
- **Blob Storage**: ~$1.50/month (10GB images)
- **Total**: ~$47/month