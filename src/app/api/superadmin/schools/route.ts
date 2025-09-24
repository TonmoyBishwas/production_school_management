import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db';
import { hashPassword, generateSecurePassword } from '@/lib/auth-server';
import { formatDate } from '@/lib/utils';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Check if user is superadmin
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'superadmin') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Fetch schools with counts
    const schools = await prisma.school.findMany({
      include: {
        _count: {
          select: {
            students: true,
            teachers: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const schoolsWithCounts = schools.map(school => ({
      id: school.id,
      name: school.name,
      adminUsername: school.admin_username,
      totalStudents: school._count.students,
      totalTeachers: school._count.teachers,
      createdAt: formatDate(school.created_at)
    }));

    return NextResponse.json({
      success: true,
      schools: schoolsWithCounts
    });

  } catch (error) {
    console.error('Error fetching schools:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is superadmin
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'superadmin') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { name, address, phone, email } = await request.json();

    if (!name) {
      return NextResponse.json(
        { message: 'School name is required' },
        { status: 400 }
      );
    }

    // Generate admin credentials
    const adminUsername = name.toLowerCase().replace(/\s+/g, '_') + '_admin';
    const adminPassword = generateSecurePassword();
    const adminPasswordHash = hashPassword(adminPassword);

    // Get or create default organization
    let organization = await prisma.organization.findFirst();
    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          name: 'School Management System',
          status: 'active'
        }
      });
    }

    // Create school
    const school = await prisma.school.create({
      data: {
        org_id: organization.id,
        name,
        address,
        phone,
        email,
        admin_username: adminUsername,
        admin_password_hash: adminPasswordHash
      }
    });

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        school_id: school.id,
        role: 'admin',
        username: adminUsername,
        password_hash: adminPasswordHash,
        first_name: 'School',
        last_name: 'Administrator',
        email
      }
    });

    // Create storage folder for school
    const storagePath = path.join(process.cwd(), 'public', 'storage', name);
    const teachersPath = path.join(storagePath, 'Teachers');
    const studentsPath = path.join(storagePath, 'Students');

    try {
      await fs.mkdir(storagePath, { recursive: true });
      await fs.mkdir(teachersPath, { recursive: true });
      await fs.mkdir(studentsPath, { recursive: true });
    } catch (folderError) {
      console.error('Error creating folders:', folderError);
      // Continue execution even if folder creation fails
    }

    return NextResponse.json({
      success: true,
      school: {
        id: school.id,
        name: school.name,
        adminUsername,
        adminPassword // Only return in response, never store
      },
      message: 'School registered successfully'
    });

  } catch (error) {
    console.error('Error creating school:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}