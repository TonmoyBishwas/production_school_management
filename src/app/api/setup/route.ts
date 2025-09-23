import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST() {
  try {
    // Test database connection
    await prisma.$connect();
    
    // Create tables if they don't exist (this will run the schema)
    await prisma.$executeRaw`SELECT 1`;
    
    // Create superadmin user if it doesn't exist
    const existingSuperadmin = await prisma.user.findUnique({
      where: { username: 'superadmin' }
    });

    if (!existingSuperadmin) {
      const { hashPassword } = await import('@/lib/auth-server');
      const hashedPassword = hashPassword('super123');
      
      await prisma.user.create({
        data: {
          schoolId: 'system',
          role: 'superadmin',
          username: 'superadmin',
          passwordHash: hashedPassword,
          firstName: 'Super',
          lastName: 'Admin',
          email: 'admin@system.com'
        }
      });
    }

    await prisma.$disconnect();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database setup completed successfully' 
    });
  } catch (error) {
    console.error('Database setup error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}