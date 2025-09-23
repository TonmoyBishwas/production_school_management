// Quick test script to check database connectivity
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  // Try different possible password configurations
  const possiblePasswords = [
    'your-password-here',
    'password123',
    'super123',
    process.env.SUPABASE_DB_PASSWORD || 'postgres'
  ];
  
  for (const password of possiblePasswords) {
    const testUrl = `postgresql://postgres:${password}@db.bhbvqmsjnotzncblicjq.supabase.co:5432/postgres`;
    console.log(`Testing with password: ${password.substring(0, 2)}***`);
    
    try {
      const prisma = new PrismaClient({
        datasources: {
          db: {
            url: testUrl
          }
        }
      });
      
      await prisma.$connect();
      console.log('✅ Connection successful!');
      console.log('DATABASE_URL=' + testUrl);
      await prisma.$disconnect();
      return testUrl;
    } catch (error) {
      console.log('❌ Connection failed:', error.message);
    }
  }
  
  console.log('All connection attempts failed');
  return null;
}

testConnection().catch(console.error);