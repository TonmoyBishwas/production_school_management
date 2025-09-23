import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role');
    const userId = request.headers.get('x-user-id');
    const schoolId = request.headers.get('x-school-id');

    if (userRole !== 'parent' || !userId || !schoolId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get parent record
    const parent = await prisma.parent.findFirst({
      where: { userId },
      include: {
        user: true,
        students: {
          include: {
            user: true
          }
        }
      }
    });

    if (!parent) {
      return NextResponse.json(
        { message: 'Parent not found' },
        { status: 404 }
      );
    }

    // Get children with their statistics
    const children = await Promise.all(
      parent.students.map(async (student) => {
        // Get attendance stats
        const totalAttendance = await prisma.attendance.count({
          where: {
            studentId: student.id,
            schoolId
          }
        });

        const presentAttendance = await prisma.attendance.count({
          where: {
            studentId: student.id,
            schoolId,
            status: 'present'
          }
        });

        const attendancePercentage = totalAttendance > 0 
          ? (presentAttendance / totalAttendance) * 100 
          : 0;

        // Get grade statistics
        const grades = await prisma.grade.findMany({
          where: {
            studentId: student.id
          },
          include: {
            exam: true
          }
        });

        const averageGrade = grades.length > 0
          ? grades.reduce((sum, grade) => {
              const percentage = (grade.marksObtained / grade.exam.totalMarks) * 100;
              return sum + percentage;
            }, 0) / grades.length
          : 0;

        return {
          id: student.id,
          studentId: student.studentId,
          name: `${student.user.firstName} ${student.user.lastName}`,
          grade: student.grade,
          section: student.section,
          attendancePercentage,
          averageGrade
        };
      })
    );

    // Calculate overall stats
    const totalChildren = children.length;
    const averageAttendance = children.length > 0
      ? children.reduce((sum, child) => sum + child.attendancePercentage, 0) / children.length
      : 0;

    // Fee calculations (placeholder - would need a fees table)
    const pendingFees = Math.floor(Math.random() * 50000); // Placeholder
    const totalFeesPaid = Math.floor(Math.random() * 200000); // Placeholder

    return NextResponse.json({
      success: true,
      stats: {
        totalChildren,
        averageAttendance,
        pendingFees,
        totalFeesPaid
      },
      children
    });

  } catch (error) {
    console.error('Error fetching parent dashboard:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}