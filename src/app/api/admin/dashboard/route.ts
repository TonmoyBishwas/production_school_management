import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role');
    const schoolId = request.headers.get('x-school-id');

    if (userRole !== 'admin' || !schoolId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get dashboard statistics
    const [totalStudents, totalTeachers, totalSubjects, todayAttendance] = await Promise.all([
      prisma.student.count({
        where: { schoolId }
      }),
      prisma.teacher.count({
        where: { schoolId }
      }),
      prisma.subject.count({
        where: { schoolId }
      }),
      prisma.attendance.count({
        where: {
          schoolId,
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          },
          status: 'present'
        }
      })
    ]);

    // Get recent students
    const recentStudents = await prisma.student.findMany({
      where: { schoolId },
      include: {
        user: true
      },
      orderBy: {
        admissionDate: 'desc'
      },
      take: 5
    });

    const formattedStudents = recentStudents.map(student => ({
      studentId: student.studentId,
      name: `${student.user.firstName} ${student.user.lastName}`,
      grade: student.grade,
      section: student.section,
      admissionDate: formatDate(student.admissionDate)
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalStudents,
        totalTeachers,
        totalSubjects,
        presentToday: todayAttendance
      },
      recentStudents: formattedStudents
    });

  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}