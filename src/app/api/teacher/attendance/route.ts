import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentTime, isTimeInRange } from '@/lib/utils';

export async function POST(request: NextRequest) {
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

    const { classId, attendance } = await request.json();

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
      }
    });

    if (!schedule) {
      return NextResponse.json(
        { message: 'Class not found or not assigned to you' },
        { status: 404 }
      );
    }

    // Verify time constraints again
    const currentTime = getCurrentTime();
    const endTimeWithGrace = addMinutesToTime(schedule.endTime, 5);
    const canMarkAttendance = isTimeInRange(currentTime, schedule.startTime, endTimeWithGrace);

    if (!canMarkAttendance) {
      return NextResponse.json(
        { message: 'Attendance marking time has expired' },
        { status: 400 }
      );
    }

    // Check if attendance already marked today
    const today = new Date();
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        schoolId,
        teacherId: teacher.id,
        subjectId: schedule.subjectId,
        period: schedule.periodNum,
        date: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
          lt: new Date(today.setHours(23, 59, 59, 999))
        }
      }
    });

    if (existingAttendance) {
      return NextResponse.json(
        { message: 'Attendance has already been marked for this class today' },
        { status: 400 }
      );
    }

    // Create attendance records
    const attendanceRecords = Object.entries(attendance).map(([studentId, status]) => ({
      schoolId,
      studentId,
      teacherId: teacher.id,
      subjectId: schedule.subjectId,
      date: new Date(),
      period: schedule.periodNum,
      status: status as string,
      markedAt: new Date()
    }));

    await prisma.attendance.createMany({
      data: attendanceRecords
    });

    return NextResponse.json({
      success: true,
      message: 'Attendance marked successfully',
      recordsCreated: attendanceRecords.length
    });

  } catch (error) {
    console.error('Error marking attendance:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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

    // Get attendance records for the teacher
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        schoolId,
        teacherId: teacher.id
      },
      include: {
        student: {
          include: {
            user: true
          }
        },
        subject: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    const formattedRecords = attendanceRecords.map(record => ({
      id: record.id,
      date: record.date.toISOString().split('T')[0],
      time: record.markedAt.toLocaleTimeString(),
      period: record.period,
      subject: record.subject.name,
      student: {
        id: record.student.id,
        studentId: record.student.studentId,
        name: `${record.student.user.firstName} ${record.student.user.lastName}`,
        grade: record.student.grade,
        section: record.student.section
      },
      status: record.status
    }));

    return NextResponse.json({
      success: true,
      attendance: formattedRecords
    });

  } catch (error) {
    console.error('Error fetching attendance records:', error);
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