import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db';
import { getCurrentTime, isTimeInRange } from '@/lib/utils';

interface RouteParams {
  params: {
    classId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const userRole = request.headers.get('x-user-role');
    const userId = request.headers.get('x-user-id');
    const schoolId = request.headers.get('x-school-id');

    if (userRole !== 'teacher' || !userId || !schoolId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { classId } = params;

    // Get teacher record
    const teacher = await prisma.teacher.findFirst({
      where: { userId }
    });

    if (!teacher) {
      return NextResponse.json(
        { message: 'Teacher not found' },
        { status: 404 }
      );
    }

    // Get schedule information
    const schedule = await prisma.schedule.findFirst({
      where: {
        id: classId,
        schoolId,
        teacherId: teacher.id
      },
      include: {
        subject: true
      }
    });

    if (!schedule) {
      return NextResponse.json(
        { message: 'Class not found or not assigned to you' },
        { status: 404 }
      );
    }

    // Check if this class is for today
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    if (schedule.day !== today) {
      return NextResponse.json(
        { message: 'This class is not scheduled for today' },
        { status: 400 }
      );
    }

    // Check time constraints
    const currentTime = getCurrentTime();
    const endTimeWithGrace = addMinutesToTime(schedule.endTime, 5);
    const canMarkAttendance = isTimeInRange(currentTime, schedule.startTime, endTimeWithGrace);

    if (!canMarkAttendance) {
      return NextResponse.json(
        { message: 'Attendance marking is not available outside class time' },
        { status: 400 }
      );
    }

    // Get students for this class
    const students = await prisma.student.findMany({
      where: {
        schoolId,
        grade: schedule.grade,
        section: schedule.section
      },
      include: {
        user: true
      },
      orderBy: {
        studentId: 'asc'
      }
    });

    // Check if attendance already marked
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        schoolId,
        teacherId: teacher.id,
        subjectId: schedule.subjectId,
        period: schedule.periodNum,
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }
    });

    if (existingAttendance) {
      return NextResponse.json(
        { message: 'Attendance has already been marked for this class today' },
        { status: 400 }
      );
    }

    const classInfo = {
      id: schedule.id,
      grade: schedule.grade,
      section: schedule.section,
      subject: schedule.subject.name,
      period: schedule.periodNum,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      canMarkAttendance,
      timeRemaining: calculateTimeRemaining(schedule.endTime)
    };

    const formattedStudents = students.map(student => ({
      id: student.id,
      studentId: student.studentId,
      name: `${student.user.firstName} ${student.user.lastName}`,
      rollNumber: parseInt(student.studentId.split('-').pop() || '0')
    }));

    return NextResponse.json({
      success: true,
      classInfo,
      students: formattedStudents
    });

  } catch (error) {
    console.error('Error fetching class data:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

function addMinutesToTime(timeStr: string, minutes: number): string {
  const [hours, mins] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, mins + minutes, 0, 0);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function calculateTimeRemaining(endTime: string): number {
  const now = new Date();
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  const end = new Date(now);
  end.setHours(endHours, endMinutes + 5, 0, 0); // 5 minutes grace
  
  return Math.max(0, end.getTime() - now.getTime());
}