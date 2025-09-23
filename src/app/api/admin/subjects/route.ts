import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db';

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

    const subjects = await prisma.subject.findMany({
      where: { schoolId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        gradeLevel: true,
        schoolId: true
      }
    });

    // Get teachers who teach these subjects
    const teachers = await prisma.teacher.findMany({
      where: { schoolId },
      include: {
        user: true
      }
    });

    const formattedSubjects = await Promise.all(subjects.map(async (subject) => {
      // Find teachers who teach this subject
      const subjectTeachers = teachers.filter(teacher => 
        (teacher.subjects as string[]).includes(subject.id)
      ).map(teacher => `${teacher.user.firstName} ${teacher.user.lastName}`);

      return {
        id: subject.id,
        name: subject.name,
        code: subject.code,
        gradeLevel: subject.gradeLevel,
        description: `Grade ${subject.gradeLevel} subject`, // Basic description
        teachers: subjectTeachers,
        teacherCount: subjectTeachers.length,
        createdAt: 'N/A' // Subject model doesn't have createdAt field
      };
    }));

    return NextResponse.json({
      success: true,
      subjects: formattedSubjects
    });

  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const { name, code, gradeLevel } = await request.json();

    if (!name || !code) {
      return NextResponse.json(
        { message: 'Subject name and code are required' },
        { status: 400 }
      );
    }

    // Check if subject already exists
    const existingSubject = await prisma.subject.findFirst({
      where: {
        schoolId,
        OR: [
          { name },
          { code }
        ]
      }
    });

    if (existingSubject) {
      return NextResponse.json(
        { message: 'Subject with this name or code already exists' },
        { status: 409 }
      );
    }

    const subject = await prisma.subject.create({
      data: {
        schoolId,
        name,
        code,
        gradeLevel: gradeLevel || 0
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Subject created successfully',
      subject: {
        id: subject.id,
        name: subject.name,
        code: subject.code,
        gradeLevel: subject.gradeLevel
      }
    });

  } catch (error) {
    console.error('Error creating subject:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}