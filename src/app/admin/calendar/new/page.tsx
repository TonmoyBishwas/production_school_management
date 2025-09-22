'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';

export default function CreateCalendarEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    event_type: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    is_all_day: false,
    grades: [] as number[],
    sections: [] as string[]
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const eventTypes = [
    { value: 'holiday', label: 'Holiday' },
    { value: 'exam', label: 'Exam' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'vacation', label: 'Vacation' },
    { value: 'event', label: 'General Event' }
  ];

  const gradeOptions = [
    { value: '1', label: 'Grade 1' },
    { value: '2', label: 'Grade 2' },
    { value: '3', label: 'Grade 3' },
    { value: '4', label: 'Grade 4' },
    { value: '5', label: 'Grade 5' },
    { value: '6', label: 'Grade 6' },
    { value: '7', label: 'Grade 7' },
    { value: '8', label: 'Grade 8' },
    { value: '9', label: 'Grade 9' },
    { value: '10', label: 'Grade 10' },
    { value: '11', label: 'Grade 11' },
    { value: '12', label: 'Grade 12' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      
      // Validate required fields
      if (!eventData.title.trim()) {
        setError('Event title is required');
        return;
      }
      if (!eventData.event_type) {
        setError('Event type is required');
        return;
      }
      if (!eventData.start_date) {
        setError('Start date is required');
        return;
      }
      if (!eventData.end_date) {
        setError('End date is required');
        return;
      }
      
      // Prepare data for API
      const apiData = {
        title: eventData.title.trim(),
        description: eventData.description.trim() || undefined,
        event_type: eventData.event_type,
        start_date: eventData.start_date, // Keep as ISO string
        end_date: eventData.end_date || eventData.start_date,
        start_time: eventData.is_all_day ? undefined : (eventData.start_time || undefined),
        end_time: eventData.is_all_day ? undefined : (eventData.end_time || undefined),
        is_all_day: eventData.is_all_day,
        grades: eventData.grades.length > 0 ? eventData.grades : undefined,
        sections: eventData.sections.length > 0 ? eventData.sections : undefined
      };

      // Remove undefined values
      Object.keys(apiData).forEach(key => {
        if (apiData[key as keyof typeof apiData] === undefined) {
          delete apiData[key as keyof typeof apiData];
        }
      });

      console.log('Sending calendar event data:', apiData);

      const response = await fetch('/api/admin/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(apiData)
      });

      const result = await response.json();

      console.log('API Response:', { status: response.status, result });

      if (response.ok && result.success) {
        setSuccess('Calendar event created successfully!');
        setTimeout(() => {
          router.push('/admin/calendar');
        }, 2000);
      } else {
        const errorMsg = result.message || result.error?.message || result.error || `HTTP ${response.status}`;
        console.error('Calendar creation error:', result);
        setError(errorMsg);
      }
    } catch (error: any) {
      console.error('Calendar event creation error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGradesChange = (gradeString: string) => {
    if (gradeString) {
      const grades = gradeString.split(',').map(g => parseInt(g.trim())).filter(g => !isNaN(g));
      setEventData({...eventData, grades});
    } else {
      setEventData({...eventData, grades: []});
    }
  };

  const handleSectionsChange = (sectionString: string) => {
    if (sectionString) {
      const sections = sectionString.split(',').map(s => s.trim()).filter(s => s.length > 0);
      setEventData({...eventData, sections});
    } else {
      setEventData({...eventData, sections: []});
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} navItems={navItems} />
      
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add Calendar Event</h1>
          <p className="text-gray-600 mt-2">Create a new calendar event for the school</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Event Title"
                type="text"
                value={eventData.title}
                onChange={(value) => setEventData({...eventData, title: value})}
                placeholder="Enter event title"
                required
                testId="title-input"
                className="md:col-span-1"
              />

              <Select
                label="Event Type"
                value={eventData.event_type}
                onChange={(value) => setEventData({...eventData, event_type: value})}
                options={eventTypes}
                required
                testId="event-type-select"
              />

              <Input
                label="Start Date"
                type="date"
                value={eventData.start_date}
                onChange={(value) => setEventData({...eventData, start_date: value})}
                required
                testId="start-date-input"
              />

              <Input
                label="End Date"
                type="date"
                value={eventData.end_date}
                onChange={(value) => setEventData({...eventData, end_date: value})}
                required
                testId="end-date-input"
              />

              <div className="md:col-span-2">
                <div className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    id="is_all_day"
                    checked={eventData.is_all_day}
                    onChange={(e) => setEventData({...eventData, is_all_day: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="is_all_day" className="text-sm font-medium text-gray-700">
                    All Day Event
                  </label>
                </div>
              </div>

              {!eventData.is_all_day && (
                <>
                  <Input
                    label="Start Time"
                    type="time"
                    value={eventData.start_time}
                    onChange={(value) => setEventData({...eventData, start_time: value})}
                    testId="start-time-input"
                  />

                  <Input
                    label="End Time"
                    type="time"
                    value={eventData.end_time}
                    onChange={(value) => setEventData({...eventData, end_time: value})}
                    testId="end-time-input"
                  />
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={eventData.description}
                onChange={(e) => setEventData({...eventData, description: e.target.value})}
                placeholder="Enter event description..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                data-testid="description-input"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Applicable Grades (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., 9,10,11 (comma-separated)"
                  value={eventData.grades.join(',')}
                  onChange={(e) => handleGradesChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  data-testid="grades-input"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for all grades</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Applicable Sections (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., A,B,C (comma-separated)"
                  value={eventData.sections.join(',')}
                  onChange={(e) => handleSectionsChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  data-testid="sections-input"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for all sections</p>
              </div>
            </div>

            {/* Preview Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Preview</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Title:</strong> {eventData.title || 'Not specified'}</p>
                <p><strong>Type:</strong> {eventData.event_type || 'Not specified'}</p>
                <p><strong>Date:</strong> {eventData.start_date ? (eventData.end_date && eventData.start_date !== eventData.end_date ? `${eventData.start_date} to ${eventData.end_date}` : eventData.start_date) : 'Not specified'}</p>
                <p><strong>Time:</strong> {eventData.is_all_day ? 'All Day' : (eventData.start_time && eventData.end_time ? `${eventData.start_time} - ${eventData.end_time}` : 'Time not specified')}</p>
                <p><strong>Applicable to:</strong> {
                  eventData.grades.length > 0 
                    ? `Grade${eventData.grades.length > 1 ? 's' : ''} ${eventData.grades.join(', ')}` 
                    : 'All Grades'
                  }{eventData.sections.length > 0 ? `, Section${eventData.sections.length > 1 ? 's' : ''} ${eventData.sections.join(', ')}` : ''}</p>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/admin/calendar')}
                testId="cancel-button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={loading}
                testId="submit-button"
              >
                Create Event
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}