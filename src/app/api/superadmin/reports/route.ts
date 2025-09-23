import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

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

    // Get comprehensive stats for reports
    const [
      totalSchools,
      totalStudents,
      totalTeachers,
      totalParents,
      recentSchools
    ] = await Promise.all([
      prisma.school.count(),
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.parent.count(),
      prisma.school.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) // This month
          }
        }
      })
    ]);

    // Calculate active schools (schools with at least one student or teacher)
    const activeSchools = await prisma.school.count({
      where: {
        OR: [
          { students: { some: {} } },
          { teachers: { some: {} } }
        ]
      }
    });

    const reports = {
      totalSchools,
      totalStudents,
      totalTeachers,
      totalParents,
      activeSchools,
      newRegistrationsThisMonth: recentSchools,
      systemHealth: {
        databaseConnected: true,
        lastUpdated: new Date().toISOString()
      }
    };

    return NextResponse.json({
      success: true,
      reports
    });

  } catch (error) {
    console.error('Error generating reports:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}