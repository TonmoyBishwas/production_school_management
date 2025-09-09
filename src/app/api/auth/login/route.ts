import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { comparePassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Special handling for superadmin
    if (username === 'superadmin' && password === 'super123') {
      const token = generateToken('superadmin', 'superadmin', 'system', 'superadmin');
      
      return NextResponse.json({
        success: true,
        token,
        user: {
          id: 'superadmin',
          username: 'superadmin',
          role: 'superadmin',
          schoolId: 'system'
        }
      });
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        school: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken(user.id, user.role, user.schoolId, user.username);

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        schoolId: user.schoolId,
        schoolName: user.school?.name
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}