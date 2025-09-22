'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Table from '@/components/Table';

interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  event_type: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  is_all_day: boolean;
  grades?: number[];
  sections?: string[];
  created_by_name: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  const navItems = [
    { label: 'Dashboard', href: '/admin', testId: 'nav-dashboard' },
    { label: 'Students', href: '/admin/students', testId: 'nav-students' },
    { label: 'Teachers', href: '/admin/teachers', testId: 'nav-teachers' },
    { label: 'Subjects', href: '/admin/subjects', testId: 'nav-subjects' },
    { label: 'Schedule', href: '/admin/schedule', testId: 'nav-schedule' },
    { label: 'Calendar', href: '/admin/calendar', testId: 'nav-calendar' }
  ];

  const user = {
    username: 'School Admin',
    role: 'admin'
  };

  useEffect(() => {
    fetchEvents();
  }, [filterType]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filterType !== 'all') {
        params.append('eventType', filterType);
      }
      
      const url = `/api/admin/calendar${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setEvents(result.data || []);
        } else {
          setError(result.message || 'Failed to load calendar events');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('Error fetching events:', error);
      setError(error.message || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'N/A';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'holiday': return 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs';
      case 'exam': return 'bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs';
      case 'meeting': return 'bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs';
      case 'vacation': return 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs';
      default: return 'bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs';
    }
  };

  // Transform events for the table
  const tableData = events.map(event => ({
    id: event.id,
    title: event.title || 'N/A',
    description: event.description || 'N/A',
    date: event.start_date === event.end_date 
      ? formatDate(event.start_date)
      : `${formatDate(event.start_date)} - ${formatDate(event.end_date)}`,
    startTime: event.is_all_day ? 'All Day' : formatTime(event.start_time),
    endTime: event.is_all_day ? 'All Day' : formatTime(event.end_time),
    type: (
      <span className={getEventTypeColor(event.event_type)}>
        {event.event_type.toUpperCase()}
      </span>
    ),
    createdBy: event.created_by_name || 'N/A',
    grades: event.grades?.length ? `Grades: ${event.grades.join(', ')}` : 'All Grades'
  }));

  const eventColumns = [
    { key: 'title', label: 'Event Title' },
    { key: 'description', label: 'Description' },
    { key: 'date', label: 'Date' },
    { key: 'startTime', label: 'Start Time' },
    { key: 'endTime', label: 'End Time' },
    { key: 'type', label: 'Type' },
    { key: 'createdBy', label: 'Created By' },
    { key: 'grades', label: 'Applicable To' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading calendar events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} navItems={navItems} />
      
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Calendar Management</h1>
            <p className="text-gray-600 mt-2">Manage school events, holidays, exams, and meetings</p>
          </div>
          <Button
            onClick={() => window.location.href = '/admin/calendar/new'}
            variant="primary"
            testId="add-event-btn"
          >
            Add New Event
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading calendar events</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
                <div className="mt-4">
                  <button
                    onClick={fetchEvents}
                    className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Controls */}
        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <label htmlFor="event-filter" className="text-sm font-medium text-gray-700">
            Filter by Type:
          </label>
          <select
            id="event-filter"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Events</option>
            <option value="holiday">Holidays</option>
            <option value="exam">Exams</option>
            <option value="meeting">Meetings</option>
            <option value="event">General Events</option>
            <option value="vacation">Vacations</option>
          </select>
          
          <div className="text-sm text-gray-500">
            Showing {events.length} event{events.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Events Table */}
        <Card title={`All Events (${events.length})`} testId="events-card">
          {!error && events.length > 0 && (
            <Table
              columns={eventColumns}
              data={tableData}
              testId="events-table"
            />
          )}
          
          {!error && events.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No events scheduled</h3>
              <p className="mt-2 text-gray-500">
                {filterType === 'all' 
                  ? 'Get started by creating your first calendar event.' 
                  : `No ${filterType} events found. Try changing the filter or create a new event.`}
              </p>
              <div className="mt-6">
                <Button
                  onClick={() => window.location.href = '/admin/calendar/new'}
                  variant="primary"
                  testId="empty-add-event-btn"
                >
                  Create {filterType === 'all' ? 'First' : 'New'} Event
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Quick Stats */}
        {events.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-6">
            {['holiday', 'exam', 'meeting', 'event', 'vacation'].map(type => {
              const count = events.filter(e => e.event_type === type).length;
              return (
                <Card key={type} testId={`stat-${type}`}>
                  <div className="text-center">
                    <div className={`inline-flex p-3 rounded-full ${getEventTypeColor(type).replace('px-2 py-1 rounded-full text-xs', 'p-3 rounded-full')}`}>
                      <span className="text-lg font-semibold">{count}</span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-gray-900 capitalize">{type}s</p>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}