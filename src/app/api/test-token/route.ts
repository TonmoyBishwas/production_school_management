import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenEdge } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    
    console.log('Testing token:', token?.substring(0, 50) + '...');
    
    // Test token verification
    const payload = verifyTokenEdge(token);
    
    return NextResponse.json({
      success: true,
      message: 'Token is valid',
      payload: payload,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Token verification failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Token verification failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 401 });
  }
}

export async function GET(request: NextRequest) {
  // Test getting token from cookies and headers like middleware does
  const cookieToken = request.cookies.get('token')?.value;
  const headerToken = request.headers.get('authorization')?.replace('Bearer ', '');
  
  const token = cookieToken || headerToken;
  
  if (!token) {
    return NextResponse.json({
      success: false,
      message: 'No token found',
      cookieToken: cookieToken ? 'present' : 'missing',
      headerToken: headerToken ? 'present' : 'missing'
    }, { status: 401 });
  }
  
  try {
    const payload = verifyTokenEdge(token);
    
    return NextResponse.json({
      success: true,
      message: 'Token from middleware source is valid',
      payload: payload,
      tokenSource: cookieToken ? 'cookie' : 'header',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Token verification failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Token verification failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      tokenSource: cookieToken ? 'cookie' : 'header',
      timestamp: new Date().toISOString()
    }, { status: 401 });
  }
}