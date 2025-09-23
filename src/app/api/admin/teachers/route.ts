import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, generateSecurePassword } from '@/lib/auth-server';
import { createTeacherFolderName, generateTeacherId } from '@/lib/utils';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

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

    const formData = await request.formData();
    
    // Extract form fields
    const teacherData = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      dob: formData.get('dob') as string,
      bloodGroup: formData.get('bloodGroup') as string,
      hireDate: formData.get('hireDate') as string,
      subjects: JSON.parse(formData.get('subjects') as string),
      address: formData.get('address') as string
    };

    // Get uploaded photos
    const photos: File[] = [];
    let photoIndex = 0;
    while (formData.has('photos')) {
      const photo = formData.get('photos') as File;
      if (photo && photo.size > 0) {
        photos.push(photo);
      }
      formData.delete('photos');
      photoIndex++;
      if (photoIndex > 10) break; // Safety limit
    }

    // Validate photos
    if (photos.length < 3 || photos.length > 10) {
      return NextResponse.json(
        { message: 'Please upload between 3 and 10 photos' },
        { status: 400 }
      );
    }

    // Validate subjects
    if (!teacherData.subjects || teacherData.subjects.length === 0) {
      return NextResponse.json(
        { message: 'Please select at least one subject' },
        { status: 400 }
      );
    }

    // Get school information
    const school = await prisma.school.findUnique({
      where: { id: schoolId }
    });

    if (!school) {
      return NextResponse.json(
        { message: 'School not found' },
        { status: 404 }
      );
    }

    // Generate teacher ID
    const teacherIdCounter = await prisma.teacher.count({
      where: { schoolId }
    });
    const teacherId = `T${new Date().getFullYear()}${(teacherIdCounter + 1).toString().padStart(3, '0')}`;

    // Generate teacher credentials
    const teacherUsername = `teacher_${teacherId}`;
    const teacherPassword = generateSecurePassword();
    const teacherPasswordHash = hashPassword(teacherPassword);

    // Calculate age
    const age = new Date().getFullYear() - new Date(teacherData.dob).getFullYear();

    // Create folder name
    const mainSubject = teacherData.subjects[0]; // Use first subject as main
    const folderName = createTeacherFolderName(
      teacherData.firstName,
      age,
      teacherData.bloodGroup,
      teacherData.hireDate,
      teacherId,
      mainSubject,
      teacherData.email
    );

    // Create teacher folder
    const storagePath = path.join(process.cwd(), 'public', 'storage', school.name, 'Teachers', folderName);
    
    try {
      await fs.mkdir(storagePath, { recursive: true });
    } catch (error) {
      console.error('Error creating teacher folder:', error);
    }

    // Create subjects if they don't exist
    const subjectRecords = await Promise.all(
      teacherData.subjects.map(async (subjectName: string) => {
        const existingSubject = await prisma.subject.findFirst({
          where: {
            schoolId,
            name: subjectName
          }
        });

        if (existingSubject) {
          return existingSubject;
        }

        return prisma.subject.create({
          data: {
            schoolId,
            name: subjectName,
            code: subjectName.substring(0, 3).toUpperCase(),
            gradeLevel: 0 // Will be updated when scheduling
          }
        });
      })
    );

    // Start database transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create teacher user
      const teacherUser = await tx.user.create({
        data: {
          schoolId,
          role: 'teacher',
          username: teacherUsername,
          passwordHash: teacherPasswordHash,
          firstName: teacherData.firstName,
          lastName: teacherData.lastName,
          email: teacherData.email,
          phone: teacherData.phone
        }
      });

      // Create teacher record
      const teacher = await tx.teacher.create({
        data: {
          userId: teacherUser.id,
          schoolId,
          teacherId,
          subjects: subjectRecords.map(s => s.id),
          hireDate: new Date(teacherData.hireDate)
        }
      });

      // Process and save photos
      const photoPromises = photos.map(async (photo, index) => {
        try {
          const buffer = Buffer.from(await photo.arrayBuffer());
          const filename = `${index + 1}.jpg`;
          const filepath = path.join(storagePath, filename);
          
          // Resize and optimize image
          await sharp(buffer)
            .resize(800, 800, { fit: 'cover' })
            .jpeg({ quality: 90 })
            .toFile(filepath);

        } catch (error) {
          console.error(`Error processing photo ${index + 1}:`, error);
          return null;
        }
      });

      await Promise.all(photoPromises);

      return { teacher, teacherUser };
    });

    return NextResponse.json({
      success: true,
      message: 'Teacher registered successfully',
      teacher: {
        id: result.teacher.id,
        teacherId,
        name: `${teacherData.firstName} ${teacherData.lastName}`,
        username: teacherUsername,
        password: teacherPassword,
        subjects: teacherData.subjects,
        photoCount: photos.length,
        folderPath: folderName
      }
    });

  } catch (error) {
    console.error('Error registering teacher:', error);
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

    const teachers = await prisma.teacher.findMany({
      where: { schoolId },
      include: {
        user: true
      },
      orderBy: {
        hireDate: 'desc'
      }
    });

    // Get subject names
    const allSubjectIds = teachers.flatMap(teacher => teacher.subjects as string[]);
    const subjects = await prisma.subject.findMany({
      where: {
        id: { in: allSubjectIds }
      }
    });

    const subjectMap = new Map(subjects.map(s => [s.id, s.name]));

    const formattedTeachers = teachers.map(teacher => ({
      id: teacher.id,
      teacherId: teacher.teacherId,
      name: `${teacher.user.firstName} ${teacher.user.lastName}`,
      email: teacher.user.email,
      phone: teacher.user.phone,
      subjects: (teacher.subjects as string[]).map(id => subjectMap.get(id) || 'Unknown'),
      hireDate: teacher.hireDate.toISOString().split('T')[0]
    }));

    return NextResponse.json({
      success: true,
      teachers: formattedTeachers
    });

  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}