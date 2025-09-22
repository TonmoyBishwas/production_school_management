# 🔍 GitHub Repository Checklist for Vercel Deployment

## ❌ **CRITICAL: Files That Should NEVER Be in GitHub**

### **Environment Files** (SECURITY RISK)
```bash
❌ .env                    # Contains secrets and database URLs
❌ .env.local             # Local environment variables
❌ .env.production        # Production secrets
❌ .env.development       # Development secrets
```

### **Node Modules** (DEPLOYMENT BLOAT)
```bash
❌ node_modules/          # Huge directory, slows deployment
❌ package-lock.json      # Can cause version conflicts (keep it actually)
```

### **Build Artifacts** (REGENERATED ON DEPLOY)
```bash
❌ .next/                 # Next.js build output
❌ out/                   # Export output
❌ build/                 # Build directory
❌ dist/                  # Distribution files
```

### **Local Data** (PRIVACY RISK)
```bash
❌ training-data/         # Student photos (privacy violation!)
❌ training-data-backup/  # Photo backups
❌ public/storage/        # Local file uploads
❌ *.jpg, *.png, *.jpeg   # Any student photos
```

---

## ✅ **Files That SHOULD Be in GitHub**

### **Source Code**
```bash
✅ src/                   # All your application code
✅ prisma/schema.prisma   # Database schema
✅ prisma/migrations/     # Database migrations
✅ scripts/               # Utility scripts
```

### **Configuration Files**
```bash
✅ package.json           # Dependencies and scripts
✅ next.config.js         # Next.js configuration
✅ tailwind.config.ts     # Tailwind CSS config
✅ tsconfig.json          # TypeScript config
✅ vercel.json            # Vercel deployment config
✅ .env.example           # Template for environment variables
```

### **Documentation**
```bash
✅ README.md              # Project documentation
✅ DEPLOYMENT.md          # Deployment instructions
✅ DEVELOPMENT-WORKFLOW.md # Development guide
✅ FIXES-COMPLETED.md     # Fix summary
```

### **Tests**
```bash
✅ tests/                 # Playwright tests
✅ playwright.config.ts   # Test configuration
```

---

## 🚨 **IMMEDIATE ACTIONS NEEDED**

### **1. Check if .env was pushed (CRITICAL)**
```bash
# If you see .env in your GitHub repo:
# 1. IMMEDIATELY change all secrets in the file
# 2. Remove .env from GitHub
# 3. Add .env to .gitignore
# 4. Generate new JWT secrets with: openssl rand -base64 32
```

### **2. Remove sensitive files if present**
```bash
# From your local repository:
git rm --cached .env
git rm --cached -r node_modules/
git rm --cached -r .next/
git rm --cached -r training-data/
git rm --cached -r public/storage/

# Commit the removal:
git commit -m "Remove sensitive files from repository"
git push origin main
```

### **3. Verify .gitignore is working**
```bash
# Check what Git is tracking:
git status

# Should NOT show:
# - .env files
# - node_modules/
# - .next/
# - training-data/
# - Any image files
```

---

## 🔐 **SECURITY VERIFICATION CHECKLIST**

Before deploying to Vercel, verify:

- [ ] **No .env files** in repository
- [ ] **No database passwords** in any files
- [ ] **No JWT secrets** hardcoded anywhere
- [ ] **No student photos** in repository
- [ ] **No node_modules** directory
- [ ] **No .next build** directory
- [ ] **.gitignore file** properly configured

---

## 📝 **VERCEL DEPLOYMENT CHECKLIST**

### **Environment Variables to Set in Vercel Dashboard:**
```bash
DATABASE_URL=postgresql://...           # From Supabase
DATABASE_DIRECT_URL=postgresql://...    # From Supabase
JWT_SECRET=                            # Generate: openssl rand -base64 32
NEXTAUTH_SECRET=                       # Generate: openssl rand -base64 32
NEXTAUTH_URL=https://your-app.vercel.app
VERCEL_BLOB_READ_WRITE_TOKEN=          # From Vercel Blob storage
CRON_SECRET=                           # Generate: openssl rand -base64 32
```

### **Optional Environment Variables:**
```bash
BCRYPT_ROUNDS=12
PASSWORD_MIN_LENGTH=8
SESSION_TIMEOUT_HOURS=8
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000
```

---

## 🚀 **SAFE DEPLOYMENT STEPS**

### **1. Verify Repository**
```bash
# Check repository size (should be < 50MB)
# Large size indicates node_modules or images were pushed

# Check sensitive files
git log --name-only | grep -E "\.(env|jpg|png|jpeg)$"
# Should return empty
```

### **2. Connect to Vercel**
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import from GitHub
4. Select your repository
5. Vercel will auto-detect Next.js

### **3. Configure Environment Variables**
1. In Vercel Dashboard → Settings → Environment Variables
2. Add all required variables listed above
3. Make sure to use PRODUCTION values, not development ones

### **4. Deploy**
1. Click "Deploy"
2. Vercel will build and deploy automatically
3. Check deployment logs for any errors

---

## 🔧 **TROUBLESHOOTING COMMON ISSUES**

### **Build Fails with "Missing Environment Variables"**
```bash
# Solution: Add all required env vars in Vercel dashboard
# Check: Settings → Environment Variables
```

### **Database Connection Error**
```bash
# Solution: Verify DATABASE_URL is correct
# Check: Supabase dashboard → Settings → Database → Connection string
```

### **File Upload Fails**
```bash
# Solution: Set VERCEL_BLOB_READ_WRITE_TOKEN
# Check: Vercel dashboard → Storage → Blob → Copy token
```

### **Large Repository Warning**
```bash
# Solution: Repository contains unnecessary files
# Check: .gitignore is properly configured
# Remove: node_modules, .next, training-data from Git
```

---

## 📋 **FINAL VERIFICATION**

Before going live, test:

- [ ] **Superadmin login** works (superadmin/super123)
- [ ] **School creation** works
- [ ] **Student registration** with photo upload works
- [ ] **All user roles** can login
- [ ] **API endpoints** respond correctly
- [ ] **Images display** correctly
- [ ] **Database queries** work
- [ ] **Error pages** display properly

---

## 🆘 **IF SECRETS WERE EXPOSED**

If you accidentally pushed .env with secrets:

### **IMMEDIATE ACTIONS:**
1. **Change all passwords** in Supabase
2. **Generate new JWT secrets**
3. **Update Vercel environment variables**
4. **Remove .env from Git history**:
   ```bash
   git filter-branch --force --index-filter \
   'git rm --cached --ignore-unmatch .env' \
   --prune-empty --tag-name-filter cat -- --all
   
   git push origin --force --all
   ```

### **PREVENTIVE MEASURES:**
1. Always use `.env.example` for templates
2. Never commit actual `.env` files
3. Use different secrets for dev/production
4. Regularly rotate secrets

---

**✅ Following this checklist ensures a secure, efficient deployment to Vercel without exposing sensitive data or bloating your repository!**