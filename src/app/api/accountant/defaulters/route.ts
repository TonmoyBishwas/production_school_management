import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role');
    const schoolId = request.headers.get('x-school-id');

    if (userRole !== 'accountant' || !schoolId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get all students for defaulter simulation
    const students = await prisma.student.findMany({
      where: { schoolId },
      include: {
        user: true
      }
    });

    // Simulate defaulters (in a real system, this would be based on actual payment records)
    const defaulterCount = Math.floor(students.length * 0.15); // 15% are defaulters
    const shuffledStudents = [...students].sort(() => 0.5 - Math.random());
    const defaulterStudents = shuffledStudents.slice(0, defaulterCount);

    const defaulters = defaulterStudents.map(student => {
      const outstandingAmount = Math.floor(Math.random() * 25000) + 5000; // Random amount between 5k-30k
      const daysOverdue = Math.floor(Math.random() * 90) + 1; // 1-90 days overdue
      
      const lastPaymentDate = new Date();
      lastPaymentDate.setDate(lastPaymentDate.getDate() - daysOverdue - 30); // Last payment was before overdue period

      return {
        id: student.id,
        studentName: `${student.user.firstName} ${student.user.lastName}`,
        studentId: student.studentId,
        grade: `${student.grade}${student.section}`,
        outstandingAmount,
        lastPayment: formatDate(lastPaymentDate),
        daysOverdue,
        parentPhone: student.user.phone || 'N/A',
        email: student.user.email || 'N/A'
      };
    }).sort((a, b) => b.daysOverdue - a.daysOverdue); // Sort by most overdue first

    return NextResponse.json({
      success: true,
      defaulters,
      totalDefaulters: defaulters.length
    });

  } catch (error) {
    console.error('Error fetching defaulters:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}