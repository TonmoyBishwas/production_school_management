import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role');
    const userId = request.headers.get('x-user-id');
    const schoolId = request.headers.get('x-school-id');

    if (userRole !== 'student' || !userId || !schoolId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get student record
    const student = await prisma.student.findFirst({
      where: { userId },
      include: {
        user: true,
        parent: {
          include: {
            user: true
          }
        }
      }
    });

    if (!student) {
      return NextResponse.json(
        { message: 'Student not found' },
        { status: 404 }
      );
    }

    // Calculate date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    // Get attendance statistics
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

    // Get homework statistics
    const [totalHomework, completedHomework] = await Promise.all([
      prisma.homework.count({
        where: {
          schoolId,
          grade: student.grade,
          section: student.section
        }
      }),
      // This would need a homework_submissions table in a real system
      // For now, we'll use a placeholder calculation
      Math.floor(Math.random() * 10) // Placeholder
    ]);

    // Get average grade
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

    // Get recent attendance (last 10 records)
    const recentAttendance = await prisma.attendance.findMany({
      where: {
        studentId: student.id,
        schoolId
      },
      include: {
        subject: true
      },
      orderBy: {
        date: 'desc'
      },
      take: 10
    });

    // Get upcoming homework
    const upcomingHomework = await prisma.homework.findMany({
      where: {
        schoolId,
        grade: student.grade,
        section: student.section,
        dueDate: {
          gte: now
        }
      },
      include: {
        subject: true,
        teacher: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      },
      take: 5
    });

    // Format data for frontend
    const studentInfo = {
      id: student.id,
      studentId: student.studentId,
      name: `${student.user.firstName} ${student.user.lastName}`,
      grade: student.grade,
      section: student.section,
      bloodGroup: student.bloodGroup,
      parentName: student.parent 
        ? `${student.parent.user.firstName} ${student.parent.user.lastName}`
        : 'N/A',
      parentPhone: student.parent?.user.phone || 'N/A'
    };

    const formattedAttendance = recentAttendance.map(att => ({
      date: formatDate(att.date),
      subject: att.subject.name,
      period: `Period ${att.period}`,
      status: att.status === 'present' ? '✅ Present' 
             : att.status === 'absent' ? '❌ Absent' 
             : '⏰ Late'
    }));

    const formattedHomework = upcomingHomework.map(hw => ({
      subject: hw.subject.name,
      title: hw.title,
      dueDate: formatDate(hw.dueDate),
      status: '📝 Pending' // Would be dynamic in real system
    }));

    return NextResponse.json({
      success: true,
      studentInfo,
      stats: {
        attendancePercentage,
        totalClasses: totalAttendance,
        classesAttended: presentAttendance,
        homeworkAssigned: totalHomework,
        homeworkCompleted: completedHomework,
        averageGrade
      },
      recentAttendance: formattedAttendance,
      upcomingHomework: formattedHomework
    });

  } catch (error) {
    console.error('Error fetching student dashboard:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}