import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db';

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

    // Get current date ranges
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Get total number of students for fee calculations
    const totalStudents = await prisma.student.count({
      where: { schoolId }
    });

    // Calculate financial statistics
    // Note: In a real system, you would have a proper payments/fees table
    // For this demo, we're using placeholder calculations

    const monthlyFeePerStudent = 5000; // ₹5,000 per month
    const totalRevenue = totalStudents * monthlyFeePerStudent * 12; // Annual revenue target
    
    // Simulate collection rates (in a real system, this would come from payments table)
    const collectionRate = 0.85; // 85% collection rate
    const collectedRevenue = totalRevenue * collectionRate;
    const pendingFees = totalRevenue - collectedRevenue;

    // Today's collections (simulated)
    const collectedToday = Math.floor(Math.random() * 50000) + 10000; // Random between 10k-60k

    // Monthly revenue (simulated)
    const monthlyRevenue = totalStudents * monthlyFeePerStudent;
    const collectedThisMonth = monthlyRevenue * collectionRate;

    // Yearly revenue
    const yearlyRevenue = collectedRevenue;

    // Calculate defaulters (students with pending fees)
    const totalDefaulters = Math.floor(totalStudents * 0.15); // 15% defaulters

    const stats = {
      totalRevenue: Math.floor(collectedRevenue),
      pendingFees: Math.floor(pendingFees),
      collectedToday,
      totalDefaulters,
      monthlyRevenue: Math.floor(collectedThisMonth),
      yearlyRevenue: Math.floor(yearlyRevenue)
    };

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error fetching accountant stats:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}