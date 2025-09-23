import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db';
import { hashPassword, generateSecurePassword } from '@/lib/auth-server';
import { createStudentFolderName, generateStudentId } from '@/lib/utils';
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
    const studentData = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      dob: formData.get('dob') as string,
      bloodGroup: formData.get('bloodGroup') as string,
      grade: parseInt(formData.get('grade') as string),
      section: formData.get('section') as string,
      parentFirstName: formData.get('parentFirstName') as string,
      parentLastName: formData.get('parentLastName') as string,
      parentPhone: formData.get('parentPhone') as string,
      parentEmail: formData.get('parentEmail') as string,
      parentOccupation: formData.get('parentOccupation') as string,
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
      if (photoIndex > 20) break; // Safety limit
    }

    // Validate photos
    if (photos.length < 5 || photos.length > 20) {
      return NextResponse.json(
        { message: 'Please upload between 5 and 20 photos' },
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

    // Generate student ID
    const studentIdCounter = await prisma.student.count({
      where: { schoolId, grade: studentData.grade }
    });
    const year = new Date().getFullYear();
    const gradeStr = studentData.grade.toString().padStart(2, '0');
    const sequence = (studentIdCounter + 1).toString().padStart(3, '0');
    const studentId = `${year}-${gradeStr}-${sequence}`;

    // Generate student credentials
    const studentUsername = `student_${studentId}`;
    const studentPassword = generateSecurePassword();
    const studentPasswordHash = hashPassword(studentPassword);

    // Generate parent credentials
    const parentUsername = `parent_${studentId}`;
    const parentPassword = generateSecurePassword();
    const parentPasswordHash = hashPassword(parentPassword);

    // Calculate age
    const age = new Date().getFullYear() - new Date(studentData.dob).getFullYear();

    // Create folder name
    const folderName = createStudentFolderName(
      studentData.firstName,
      age,
      studentData.grade,
      studentData.section,
      studentData.bloodGroup,
      studentData.dob,
      studentId,
      studentData.parentPhone
    );

    // Create student folder
    const storagePath = path.join(process.cwd(), 'public', 'storage', school.name, 'Students', folderName);
    
    try {
      await fs.mkdir(storagePath, { recursive: true });
    } catch (error) {
      console.error('Error creating student folder:', error);
    }

    // Start database transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create parent user first
      const parentUser = await tx.user.create({
        data: {
          schoolId,
          role: 'parent',
          username: parentUsername,
          passwordHash: parentPasswordHash,
          firstName: studentData.parentFirstName,
          lastName: studentData.parentLastName,
          email: studentData.parentEmail,
          phone: studentData.parentPhone
        }
      });

      // Create parent record
      const parent = await tx.parent.create({
        data: {
          userId: parentUser.id,
          schoolId,
          address: studentData.address,
          occupation: studentData.parentOccupation
        }
      });

      // Create student user
      const studentUser = await tx.user.create({
        data: {
          schoolId,
          role: 'student',
          username: studentUsername,
          passwordHash: studentPasswordHash,
          firstName: studentData.firstName,
          lastName: studentData.lastName
        }
      });

      // Create student record
      const student = await tx.student.create({
        data: {
          userId: studentUser.id,
          schoolId,
          studentId,
          grade: studentData.grade,
          section: studentData.section,
          bloodGroup: studentData.bloodGroup,
          dob: new Date(studentData.dob),
          admissionDate: new Date(),
          parentId: parent.id
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

          // Save photo record to database
          return tx.studentPhoto.create({
            data: {
              studentId: student.id,
              schoolId: student.schoolId,
              photoPath: path.join('storage', school.name, 'Students', folderName, filename),
              photoNumber: index + 1
            }
          });
        } catch (error) {
          console.error(`Error processing photo ${index + 1}:`, error);
          return null;
        }
      });

      await Promise.all(photoPromises);

      return { student, parent, studentUser, parentUser };
    });

    return NextResponse.json({
      success: true,
      message: 'Student registered successfully',
      student: {
        id: result.student.id,
        studentId,
        name: `${studentData.firstName} ${studentData.lastName}`,
        username: studentUsername,
        password: studentPassword,
        grade: studentData.grade,
        section: studentData.section,
        photoCount: photos.length,
        folderPath: folderName
      },
      parent: {
        id: result.parent.id,
        username: parentUsername,
        password: parentPassword,
        name: `${studentData.parentFirstName} ${studentData.parentLastName}`
      }
    });

  } catch (error) {
    console.error('Error registering student:', error);
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

    const students = await prisma.student.findMany({
      where: { schoolId },
      include: {
        user: true,
        parent: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        admissionDate: 'desc'
      }
    });

    const formattedStudents = students.map(student => ({
      id: student.id,
      studentId: student.studentId,
      name: `${student.user.firstName} ${student.user.lastName}`,
      grade: student.grade,
      section: student.section,
      bloodGroup: student.bloodGroup,
      parentName: student.parent ? `${student.parent.user.firstName} ${student.parent.user.lastName}` : 'N/A',
      parentPhone: student.parent?.user.phone || 'N/A',
      admissionDate: student.admissionDate.toISOString().split('T')[0]
    }));

    return NextResponse.json({
      success: true,
      students: formattedStudents
    });

  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}