import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import { verifyTokenEdge } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Extract JWT token from Authorization header
    const authorization = request.headers.get('authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authorization.split(' ')[1];
    let user;

    try {
      user = await verifyTokenEdge(token);
    } catch (error) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }

    if (user.role !== 'admin' || !user.schoolId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { 
      title, 
      description, 
      event_type, 
      start_date, 
      end_date, 
      start_time, 
      end_time, 
      is_all_day,
      grades,
      sections 
    } = await request.json();

    // Validate required fields
    if (!event_type || !title || !start_date || !end_date) {
      return NextResponse.json(
        { message: 'Event type, title, start date, and end date are required' },
        { status: 400 }
      );
    }

    // Validate date range
    const start = new Date(start_date);
    const end = new Date(end_date);
    
    if (end < start) {
      return NextResponse.json(
        { message: 'End date cannot be before start date' },
        { status: 400 }
      );
    }

    // Create calendar event
    const calendarEvent = await prisma.academicCalendar.create({
      data: {
        schoolId: user.schoolId,
        eventType: event_type,
        name: title,
        startDate: start,
        endDate: end,
        startTime: start_time || null,
        endTime: end_time || null,
        description: description || null
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Calendar event created successfully',
      data: {
        id: calendarEvent.id,
        event_type: calendarEvent.eventType,
        title: calendarEvent.name,
        start_date: formatDate(calendarEvent.startDate),
        end_date: formatDate(calendarEvent.endDate),
        start_time: calendarEvent.startTime,
        end_time: calendarEvent.endTime,
        description: calendarEvent.description,
        created_by_name: 'Admin'
      }
    });

  } catch (error) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Extract JWT token from Authorization header
    const authorization = request.headers.get('authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authorization.split(' ')[1];
    let user;

    try {
      user = await verifyTokenEdge(token);
    } catch (error) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }

    if (user.role !== 'admin' || !user.schoolId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const month = url.searchParams.get('month');
    const year = url.searchParams.get('year');

    let whereClause: any = { schoolId: user.schoolId };

    // Filter by month/year if provided
    if (month && year) {
      const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      
      whereClause = {
        ...whereClause,
        OR: [
          {
            startDate: {
              gte: startOfMonth,
              lte: endOfMonth
            }
          },
          {
            endDate: {
              gte: startOfMonth,
              lte: endOfMonth
            }
          },
          {
            AND: [
              { startDate: { lte: startOfMonth } },
              { endDate: { gte: endOfMonth } }
            ]
          }
        ]
      };
    }

    const events = await prisma.academicCalendar.findMany({
      where: whereClause,
      orderBy: { startDate: 'asc' }
    });

    const formattedEvents = events.map(event => ({
      id: event.id,
      event_type: event.eventType,
      title: event.name,
      start_date: formatDate(event.startDate),
      end_date: formatDate(event.endDate),
      start_time: event.startTime,
      end_time: event.endTime,
      description: event.description,
      created_by_name: 'Admin',
      // Calculate if event is ongoing
      isOngoing: new Date() >= event.startDate && new Date() <= event.endDate,
      // Calculate if event is upcoming
      isUpcoming: new Date() < event.startDate
    }));

    return NextResponse.json({
      success: true,
      data: formattedEvents
    });

  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Extract JWT token from Authorization header
    const authorization = request.headers.get('authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authorization.split(' ')[1];
    let user;

    try {
      user = await verifyTokenEdge(token);
    } catch (error) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }

    if (user.role !== 'admin' || !user.schoolId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { message: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Check if event belongs to this school
    const event = await prisma.academicCalendar.findFirst({
      where: {
        id,
        schoolId: user.schoolId
      }
    });

    if (!event) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      );
    }

    await prisma.academicCalendar.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Calendar event deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}