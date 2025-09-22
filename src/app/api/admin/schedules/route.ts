import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role');
    const schoolId = request.headers.get('x-school-id');

    if (userRole !== 'admin' || !schoolId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const {
      grade,
      section,
      day,
      periodNum,
      startTime,
      endTime,
      subjectId,
      teacherId
    } = await request.json();

    // Validate required fields
    if (!grade || !section || !day || !periodNum || !startTime || !endTime || !subjectId || !teacherId) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if schedule slot is already occupied
    const existingSchedule = await prisma.schedule.findFirst({
      where: {
        schoolId,
        grade: parseInt(grade),
        section,
        day,
        periodNum: parseInt(periodNum)
      }
    });

    if (existingSchedule) {
      return NextResponse.json(
        { message: 'This time slot is already occupied' },
        { status: 409 }
      );
    }

    // Check if teacher is available at this time
    const teacherConflict = await prisma.schedule.findFirst({
      where: {
        schoolId,
        teacherId,
        day,
        periodNum: parseInt(periodNum)
      }
    });

    if (teacherConflict) {
      return NextResponse.json(
        { message: 'Teacher is not available at this time' },
        { status: 409 }
      );
    }

    // Create schedule
    const schedule = await prisma.schedule.create({
      data: {
        schoolId,
        grade: parseInt(grade),
        section,
        day,
        periodNum: parseInt(periodNum),
        startTime,
        endTime,
        subjectId,
        teacherId
      },
      include: {
        subject: true,
        teacher: {
          include: {
            user: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Schedule created successfully',
      schedule: {
        id: schedule.id,
        grade: schedule.grade,
        section: schedule.section,
        day: schedule.day,
        periodNum: schedule.periodNum,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        subject: schedule.subject.name,
        teacher: `${schedule.teacher.user.firstName} ${schedule.teacher.user.lastName}`
      }
    });

  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const schedules = await prisma.schedule.findMany({
      where: { schoolId },
      include: {
        subject: true,
        teacher: {
          include: {
            user: true
          }
        }
      },
      orderBy: [
        { day: 'asc' },
        { periodNum: 'asc' },
        { grade: 'asc' }
      ]
    });

    const formattedSchedules = schedules.map(schedule => ({
      id: schedule.id,
      grade: schedule.grade,
      section: schedule.section,
      day: schedule.day,
      periodNum: schedule.periodNum,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      subject: schedule.subject.name,
      teacher: `${schedule.teacher.user.firstName} ${schedule.teacher.user.lastName}`,
      teacherId: schedule.teacherId,
      subjectId: schedule.subjectId
    }));

    return NextResponse.json({
      success: true,
      schedules: formattedSchedules
    });

  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}