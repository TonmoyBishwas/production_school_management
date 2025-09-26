# Deployment-First Development Guide for Claude Code

## 🚨 Critical Lessons Learned from 3 Days of Database Hell

This guide is written after spending 3 days trying to fix "Internal server error" issues when converting a local project to production. **DON'T REPEAT THESE MISTAKES.**

## 🎯 Core Philosophy: Deploy Early, Deploy Often

**NEVER** develop locally first and then try to deploy. Always start with deployment and test everything in production from day 1.

## 📋 Step-by-Step Deployment-First Approach

### Phase 1: Setup Foundation (30 minutes)

1. **Create Supabase Project FIRST**
   ```bash
   # Test connection immediately after creation
   curl -X GET "https://your-project.supabase.co/rest/v1/" \
     -H "apikey: your-anon-key"
   ```

2. **Create Vercel Project SECOND**
   - Link to GitHub repository
   - Test deployment with basic Next.js app
   - **NEVER** add database code until Step 3 is complete

3. **Test Connection Between Vercel and Supabase**
   - Create `/api/health-check` endpoint
   - Test BOTH direct connection (port 5432) AND pooled connection (port 6543)
   - **CRITICAL**: Only proceed when both work

### Phase 2: Database Setup (1 hour)

4. **Database Schema in Supabase**
   - Use Supabase dashboard SQL editor
   - Apply migrations through Supabase MCP tools
   - Test every table creation immediately

5. **Test Database Operations**
   - Create simple CRUD API endpoints
   - Test INSERT, SELECT, UPDATE, DELETE
   - Use Playwright to test API endpoints
   - **NEVER** build UI until database operations work 100%

### Phase 3: Authentication (30 minutes)

6. **Implement Auth System**
   - Use Supabase Auth or JWT tokens
   - Test login/logout immediately
   - Test protected routes

### Phase 4: Build Features Incrementally (ongoing)

7. **Add One Feature at a Time**
   - Deploy after each feature
   - Test in production
   - Fix issues immediately before moving to next feature

## 🔥 Critical Technical Guidelines

### Database Connection Strings

**ALWAYS test both connection types:**

```typescript
// Direct Connection (for heavy operations)
const DIRECT_URL = `postgresql://postgres:${password}@db.${projectId}.supabase.co:5432/postgres`

// Pooled Connection (for serverless functions)
const POOLED_URL = `postgresql://postgres:${password}@db.${projectId}.supabase.co:6543/postgres?pgbouncer=true`
```

**Test script to add to every project:**
```typescript
// /api/test-connections/route.ts
export async function GET() {
  const results = {
    direct: await testConnection(DIRECT_URL),
    pooled: await testConnection(POOLED_URL)
  };
  return Response.json(results);
}
```

### Next.js Configuration for Serverless

**ALWAYS add these exports to API routes:**
```typescript
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60; // For complex operations
```

**ALWAYS add to pages that use localStorage:**
```typescript
export const dynamic = 'force-dynamic';
```

### Error Handling Pattern

**ALWAYS use this error handling pattern:**
```typescript
try {
  // operation
} catch (error) {
  console.error('Detailed error:', {
    name: error instanceof Error ? error.name : 'Unknown',
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    cause: error instanceof Error ? error.cause : undefined
  });

  return NextResponse.json({
    success: false,
    message: 'Operation failed',
    error: error instanceof Error ? error.message : 'Unknown error',
    timestamp: new Date().toISOString()
  }, { status: 500 });
}
```

## 🚫 Things That WILL Break Your Deployment

### 1. Database Connection Issues
- **Problem**: Using wrong port (5432 vs 6543)
- **Solution**: Test both ports, use pooled (6543) for serverless
- **Test**: Create `/api/test-db` endpoint immediately

### 2. Static Generation with Dynamic Content
- **Problem**: Next.js tries to pre-render pages that need runtime data
- **Solution**: Add `export const dynamic = 'force-dynamic'` to ALL pages using:
  - localStorage
  - Database queries
  - Authentication

### 3. TypeScript Errors in Production
- **Problem**: Strict type checking breaks builds
- **Solution**: Cast errors as `(error as any)` in catch blocks
- **Test**: Run `npm run build` after every change

### 4. Environment Variables
- **Problem**: Local `.env` vs Vercel environment variables
- **Solution**: Set environment variables in Vercel dashboard FIRST
- **Test**: Use `/api/env-check` endpoint to verify

### 5. Prisma Client Issues
- **Problem**: Connection pooling and serverless compatibility
- **Solution**: Use this pattern:
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error', 'warn']
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

## 🧪 Testing Strategy

### 1. API-First Testing
- Test every API endpoint with curl/Postman BEFORE building UI
- Use Playwright to automate API testing
- Test error scenarios (wrong data, missing fields, etc.)

### 2. Database Testing
```typescript
// Always test these operations first:
const tests = [
  'CREATE TABLE test_table (id serial, name text)',
  'INSERT INTO test_table (name) VALUES ($1)',
  'SELECT * FROM test_table',
  'UPDATE test_table SET name = $1 WHERE id = $2',
  'DELETE FROM test_table WHERE id = $1',
  'DROP TABLE test_table'
];
```

### 3. Authentication Testing
- Test login with valid credentials
- Test login with invalid credentials
- Test protected routes without token
- Test protected routes with expired token

## 📊 Monitoring and Debugging

### 1. Add Health Check Endpoints
```typescript
// /api/health/route.ts - Always add this first
export async function GET() {
  return Response.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: await testDatabaseConnection(),
    environment: process.env.NODE_ENV
  });
}
```

### 2. Add Debug Endpoints (Remove in Production)
```typescript
// /api/debug/env/route.ts
export async function GET() {
  return Response.json({
    hasDatabase: !!process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV,
    // DON'T log actual values in production
  });
}
```

### 3. Comprehensive Logging
```typescript
// Always log these for debugging:
console.log('Operation started:', { timestamp: new Date() });
console.log('Input received:', { data: sanitizedInput });
console.log('Database query:', { query: 'SELECT...' });
console.log('Operation completed:', { success: true, recordsAffected: 1 });
```

## 🎯 Success Checklist

Before building ANY features, ensure:

- [ ] Health check endpoint returns 200
- [ ] Database connection test passes
- [ ] Simple CRUD operations work
- [ ] Authentication works
- [ ] Error handling returns proper JSON
- [ ] TypeScript compiles without errors
- [ ] Vercel deployment succeeds
- [ ] All environment variables are set

## 🚀 Recommended Development Flow

1. **Day 1**: Setup + Database + Health Checks
2. **Day 2**: Authentication + Basic CRUD
3. **Day 3**: First feature + Testing
4. **Day 4+**: Incremental features with immediate testing

## 💡 Pro Tips for Claude Code

1. **Always use MCP tools first**: Supabase MCP, Vercel MCP, Playwright
2. **Test in production immediately**: Don't assume local behavior = production behavior
3. **Start with the simplest possible version**: One table, one API endpoint, one page
4. **Add complexity gradually**: Each change should be deployable and testable
5. **Use TypeScript strictly**: But cast errors as `any` in catch blocks
6. **Monitor deployments**: Check logs immediately after each deploy
7. **Keep environment variables simple**: Avoid special characters in passwords

## 🔴 RED FLAGS - Stop Everything If You See

1. "Internal server error" without specific error message
2. Database connection errors during build time
3. TypeScript errors about 'unknown' error types
4. 404 errors on pages that should exist
5. Environment variables not working in production
6. Any difference between local and production behavior

**When you see these: Fix immediately before proceeding.**

---

**Remember**: It's better to spend 2 hours setting up proper foundations than 3 days debugging deployment issues. Start simple, test everything, deploy often.