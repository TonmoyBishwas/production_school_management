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

    // In a real system, this would fetch from a payments/transactions table
    // For this demo, we'll create simulated transaction data

    const students = await prisma.student.findMany({
      where: { schoolId },
      include: {
        user: true
      },
      take: 10 // Get 10 students for demo transactions
    });

    // Generate simulated recent transactions
    const paymentMethods = ['Cash', 'Bank Transfer', 'Credit Card', 'UPI', 'Debit Card'];
    const feeTypes = ['Tuition Fee', 'Admission Fee', 'Transport Fee', 'Library Fee', 'Lab Fee'];
    const statuses = ['completed', 'pending', 'failed'];

    const transactions = students.map((student, index) => {
      const amount = Math.floor(Math.random() * 15000) + 5000; // Random amount between 5k-20k
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30)); // Random date in last 30 days

      return {
        id: `txn_${student.id}_${index}`,
        studentName: `${student.user.firstName} ${student.user.lastName}`,
        studentId: student.studentId,
        amount,
        type: feeTypes[Math.floor(Math.random() * feeTypes.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        date: formatDate(date),
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)]
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      success: true,
      transactions
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}