import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

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
      where: { userId },
      include: {
        user: true
      }
    });

    if (!teacher) {
      return NextResponse.json(
        { message: 'Teacher not found' },
        { status: 404 }
      );
    }

    const today = new Date();
    const todayStr = today.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Get today's schedule
    const todaySchedule = await prisma.schedule.findMany({
      where: {
        schoolId,
        teacherId: teacher.id,
        day: todayStr
      },
      include: {
        subject: true
      },
      orderBy: {
        periodNum: 'asc'
      }
    });

    // Get attendance records for today
    const todayAttendance = await prisma.attendance.findMany({
      where: {
        schoolId,
        teacherId: teacher.id,
        date: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
          lt: new Date(today.setHours(23, 59, 59, 999))
        }
      }
    });

    // Calculate stats
    const classesToday = todaySchedule.length;
    const attendanceMarked = todayAttendance.length;
    const pendingAttendance = classesToday - attendanceMarked;

    // Get total students count for teacher's classes
    const teacherClasses = await prisma.schedule.findMany({
      where: {
        schoolId,
        teacherId: teacher.id
      },
      select: {
        grade: true,
        section: true
      }
    });

    // Get unique grade-section combinations
    const uniqueClasses = teacherClasses.reduce((acc, curr) => {
      const key = `${curr.grade}-${curr.section}`;
      if (!acc.includes(key)) {
        acc.push(key);
      }
      return acc;
    }, [] as string[]);

    // Count students in teacher's classes
    const studentsTotal = await prisma.student.count({
      where: {
        schoolId,
        OR: uniqueClasses.map(cls => {
          const [grade, section] = cls.split('-');
          return {
            grade: parseInt(grade),
            section
          };
        })
      }
    });

    // Check current class
    const now = new Date();
    const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const currentClass = todaySchedule.find(schedule => {
      const startTime = schedule.startTime;
      const endTime = schedule.endTime;
      
      // Add 5 minutes grace period
      const endWithGrace = addMinutesToTime(endTime, 5);
      
      return currentTimeStr >= startTime && currentTimeStr <= endWithGrace;
    });

    // Format schedule for display
    const formattedSchedule = todaySchedule.map(schedule => {
      const hasAttendance = todayAttendance.some(att => 
        att.period === schedule.periodNum
      );
      
      return {
        id: schedule.id,
        period: schedule.periodNum,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        subject: schedule.subject.name,
        grade: schedule.grade,
        section: schedule.section,
        attendanceMarked: hasAttendance
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        classesToday,
        studentsTotal,
        attendanceMarked,
        pendingAttendance
      },
      schedule: formattedSchedule,
      currentClass: currentClass ? {
        id: currentClass.id,
        grade: currentClass.grade,
        section: currentClass.section,
        subject: currentClass.subject.name,
        startTime: currentClass.startTime,
        endTime: currentClass.endTime,
        period: currentClass.periodNum,
        canMarkAttendance: true,
        attendanceStatus: 'in_progress'
      } : null
    });

  } catch (error) {
    console.error('Error fetching teacher dashboard:', error);
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