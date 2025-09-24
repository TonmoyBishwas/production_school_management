import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_SET: process.env.DATABASE_URL ? 'YES' : 'NO',
      DATABASE_URL_FORMAT: process.env.DATABASE_URL ? 
        process.env.DATABASE_URL.substring(0, 20) + '...' + process.env.DATABASE_URL.slice(-20) : 'NOT SET',
      JWT_SECRET_SET: process.env.JWT_SECRET ? 'YES' : 'NO',
      JWT_SECRET_LENGTH: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
      NEXTAUTH_SECRET_SET: process.env.NEXTAUTH_SECRET ? 'YES' : 'NO',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      environment: envCheck
    });

  } catch (error) {
    console.error('Environment test error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Environment test failed',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}