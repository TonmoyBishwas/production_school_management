import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Check if user is superadmin
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'superadmin') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get total counts
    const [totalSchools, totalStudents, totalTeachers] = await Promise.all([
      prisma.school.count(),
      prisma.student.count(),
      prisma.teacher.count()
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalSchools,
        totalStudents,
        totalTeachers
      }
    });

  } catch (error) {
    console.error('Error fetching superadmin stats:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}